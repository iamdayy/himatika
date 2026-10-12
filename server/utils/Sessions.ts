import { createHash, randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { ISetSessionParams } from "~~/types/IParam";
import type { ISessionSchema } from "~~/types/ISchemas";
import { SessionModel } from "../models/SessionModel";
import { UserModel, UserPopulateOptions } from "../models/UserModel";
import {
  redisDelete,
  redisGetJson,
  redisSetJson,
} from "./upstashRedis";

const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 90;

// Rotation grace window: how many recently superseded refresh-token hashes
// are still honored, and for how long. Legitimate concurrent refreshes
// (two tabs, background periodic refresh racing a 401-retry, retried
// requests whose response was lost) present an already-rotated token.
// Honoring those within the window prevents false "theft" revocations
// that log users out of every device at once.
//
// The window is a time-pruned sliding list (not just the single previous
// hash) plus a bounded compare-and-swap retry loop, so even N-way
// concurrent refreshes converge instead of revoking each other: every
// presented hash that was valid inside the window is rotated again, and
// only a completely unknown hash is treated as theft.
const PREVIOUS_HASH_KEEP_COUNT = 50;
const PREVIOUS_HASH_TTL_MS = 24 * 60 * 60 * 1000;
// Upper bound on rotation compare-and-swap rounds per refresh call. Each
// round lets at least one concurrent refresher win; stragglers re-read the
// latest state and retry. Exhaustion with a grace-verified token is
// reported as 429 (transient, client retries) — never as revocation.
const MAX_ROTATION_ATTEMPTS = 10;

const hashRefreshToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

const sessionCacheKey = (sid: string): string => `session:${sid}`;
const refreshCacheKey = (tokenHash: string): string => `refresh:${tokenHash}`;

/**
 * True when the presented hash belongs to a recently rotated-out refresh
 * token whose grace period has not expired yet.
 */
const isPreviousHashUsable = (
  session: { previousRefreshTokenHashes?: unknown; previousRefreshTokenExpiresAt?: unknown } | null | undefined,
  tokenHash: string
): boolean => {
  if (!session || !Array.isArray(session.previousRefreshTokenHashes)) return false;
  if (!session.previousRefreshTokenHashes.includes(tokenHash)) return false;
  if (!session.previousRefreshTokenExpiresAt) return false;
  return new Date(session.previousRefreshTokenExpiresAt).getTime() > Date.now();
};

interface CachedSession {
  user?: string;
  guest?: string;
}

const getSecretKey = () => {
  const secretKey = useRuntimeConfig().jwtSecret;
  if (!secretKey) {
    throw new Error("JWT secret key is not configured.");
  }
  return secretKey;
};

/**
 * Checks the validity of an access token (Stateless + Stateful).
 *
 * Access tokens carry a `sid` claim bound to a specific Session row, so
 * revocation of one session no longer leaves every other access token valid.
 */
export const checkSession = async (payload: string) => {
  try {
    const decoded = jwt.verify(payload, getSecretKey()) as jwt.JwtPayload;
    if (!decoded || (!decoded.user && !decoded.guest)) {
      throw createError({
        statusMessage: "Invalid Session Data",
        statusCode: 401,
      });
    }

    if (decoded.sid) {
      // MongoDB remains authoritative for revocation. Redis is used for
      // refresh-token lookup, not as a source of truth for access checks.
      const session = await SessionModel.findOne({ _id: decoded.sid });
      if (
        !session ||
        (decoded.user &&
          String((session.user as { _id?: unknown })?._id ?? session.user) !==
            String(decoded.user)) ||
        (decoded.guest &&
          String((session.guest as { _id?: unknown })?._id ?? session.guest) !==
            String(decoded.guest))
      ) {
        throw createError({
          statusMessage: "Session revoked",
          statusCode: 401,
        });
      }
    } else {
      // Legacy tokens without `sid`: fall back to per-subject existence.
      const query = decoded.user ? { user: decoded.user } : { guest: decoded.guest };
      const sessionExists = await SessionModel.exists(query);
      if (!sessionExists) {
        throw createError({
          statusMessage: "Session revoked",
          statusCode: 401,
        });
      }
    }

    return {
      username: decoded.username,
      member: decoded.member,
      guest: decoded.guest,
    };
  } catch (error: any) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      throw createError({
        statusMessage: "Token expired or invalid",
        statusCode: 401,
      });
    }
    throw error;
  }
};

const signAccessToken = (tokenPayload: Record<string, unknown>, sid?: string) =>
  jwt.sign({ ...tokenPayload, ...(sid ? { sid } : {}) }, getSecretKey(), {
    expiresIn: "60m",
  });

/**
 * Refreshes a session: rotates the refresh token and issues a fresh access
 * token bound (`sid`) to the rotated session row.
 *
 * Presenting a refresh token that is no longer stored is treated as reuse
 * (theft signal): every session of that subject is revoked.
 */
export const refreshSession = async (payload: string) => {
  try {
    const decoded = jwt.verify(payload, getSecretKey()) as jwt.JwtPayload;
    if (!decoded || (!decoded.user && !decoded.guest)) {
      throw createError({ statusMessage: "Invalid Token", statusCode: 401 });
    }

    const tokenHash = hashRefreshToken(payload);
    const cachedRefresh = await redisGetJson<CachedSession & { sid?: string }>(
      refreshCacheKey(tokenHash)
    );
    let session = cachedRefresh?.sid
      ? await SessionModel.findOne({
          _id: cachedRefresh.sid,
          $or: [{ refreshTokenHash: tokenHash }, { refreshToken: payload }],
        })
      : await SessionModel.findOne({
          $or: [{ refreshTokenHash: tokenHash }, { refreshToken: payload }],
        });

    let usedGraceWindow = false;
    if (!session) {
      // Grace path: the presented token may have been rotated out moments
      // ago by a concurrent refresh (second tab, retried request). Honor
      // it within the grace window instead of assuming theft.
      const graceSession = await SessionModel.findOne({
        previousRefreshTokenHashes: tokenHash,
      });
      if (graceSession && isPreviousHashUsable(graceSession, tokenHash)) {
        console.warn(
          "Refresh presented a recently-rotated token; rotating again instead of revoking."
        );
        session = graceSession;
        usedGraceWindow = true;
      } else {
        // Reuse detection: this refresh token was rotated away already (or
        // never existed). Assume theft and kill every session for the subject.
        await SessionModel.deleteMany(
          decoded.user ? { user: decoded.user } : { guest: decoded.guest }
        );
        throw createError({
          statusMessage: "Session not found or invalid",
          statusCode: 401,
        });
      }
    }

    let memberPayload = null;
    let guestPayload = null;
    let username = null;

    if (session.user) {
      // Do the heavy populate once per refresh
      const user = await UserModel.findById(session.user)
        .populate(UserPopulateOptions);

      if (!user) throw createError({ statusCode: 401 });

      username = user.username;
      if (user.member) {
        const m = user.member as any;
        memberPayload = {
          _id: m._id,
          NIM: m.NIM,
          fullName: m.fullName,
          avatar: m.avatar,
          email: m.email,
          status: m.status,
          semester: m.semester,
          class: m.class,
          sex: m.sex,
          phone: m.phone,
          organizer: m.organizer ? { role: m.organizer.role, period: m.organizer.period } : null
        };
      }
      if (user.guest) {
        guestPayload = user.guest;
      }
    } else if (session.guest) {
      const { GuestModel } = await import("~~/server/models/GuestModel");
      const guest = await GuestModel.findById(session.guest);
      guestPayload = guest;
    }

    const tokenPayload = {
      user: session.user,
      guest: session.guest,
      username: username,
      member: memberPayload,
    };

    // Rotate: the presented refresh token becomes invalid immediately.
    // A random jti is REQUIRED — signing identical static claims yields a
    // byte-identical JWT, which would make the rotation a no-op.
    const newRefreshToken = jwt.sign(
      { user: session.user, guest: session.guest, jti: randomBytes(16).toString("hex") },
      getSecretKey(),
      { expiresIn: "90d" }
    );
    const newTokenHash = hashRefreshToken(newRefreshToken);
    const previousExpiresAt = new Date(Date.now() + PREVIOUS_HASH_TTL_MS);
    // The superseded hash stays honored for the grace window so concurrent
    // refreshes presenting it are rotated again instead of treated as theft.
    const buildRotationUpdate = (hashToSupersede: string) => ({
      $set: {
        refreshTokenHash: newTokenHash,
        previousRefreshTokenExpiresAt: previousExpiresAt,
      },
      $push: {
        previousRefreshTokenHashes: {
          $each: [hashToSupersede],
          $slice: -PREVIOUS_HASH_KEEP_COUNT,
        },
      },
      $unset: { refreshToken: 1 },
    });

    // Compare-and-swap loop: key each attempt on the latest known current
    // hash. Exactly one concurrent refresher wins per hash generation; the
    // rest re-read the winner's state and converge in later rounds instead
    // of being mistaken for theft.
    let filterHash: string | null = null;
    let usePlaintextFilter = false;
    if (usedGraceWindow) {
      // The presented hash is already superseded: swap on the stored one.
      if (typeof session.refreshTokenHash === "string") {
        filterHash = session.refreshTokenHash;
      }
    } else if (session.refreshTokenHash) {
      filterHash = tokenHash;
    } else {
      // Legacy plaintext row: match it directly on the first attempt.
      usePlaintextFilter = true;
    }
    let supersededHash = filterHash ?? tokenHash;
    // True once the presented token is proven recently-valid (current or
    // inside the grace window). Only a token that was NEVER verified may
    // trigger mass revocation; a verified one that keeps losing the race
    // is reported as transient contention (429) so the client retries.
    let graceVerified = usedGraceWindow;
    let rotatedSession = null;
    for (
      let attempt = 0;
      attempt < MAX_ROTATION_ATTEMPTS && !rotatedSession;
      attempt++
    ) {
      if (attempt > 0) {
        const freshSession = await SessionModel.findOne({ _id: session._id });
        if (!freshSession) break;
        if (isPreviousHashUsable(freshSession, tokenHash)) {
          graceVerified = true;
        } else if (!graceVerified) {
          break;
        }
        if (typeof freshSession.refreshTokenHash === "string") {
          filterHash = freshSession.refreshTokenHash;
          supersededHash = freshSession.refreshTokenHash;
          usePlaintextFilter = false;
        } else if (!graceVerified) {
          break;
        }
      }
      const currentTokenFilter = usePlaintextFilter
        ? { refreshToken: payload }
        : { refreshTokenHash: filterHash as string };
      rotatedSession = await SessionModel.findOneAndUpdate(
        { _id: session._id, ...currentTokenFilter },
        buildRotationUpdate(supersededHash),
        { new: true }
      );
      if (!rotatedSession && attempt === 0) {
        console.warn(
          "Refresh lost the rotation race; retrying from the current token."
        );
      }
    }

    if (!rotatedSession) {
      if (graceVerified) {
        // Recently-valid token that could not win a rotation slot:
        // transient contention, NOT theft. The client backs off and
        // retries with the same token; the session row is untouched.
        throw createError({
          statusMessage: "Rotation contention, please retry",
          statusCode: 429,
        });
      }
      // Genuinely unknown token: treat as reuse and revoke every session
      // for the subject.
      await SessionModel.deleteMany(
        session.user ? { user: session.user } : { guest: session.guest }
      );
      throw createError({
        statusMessage: "Session not found or invalid",
        statusCode: 401,
      });
    }

    const newToken = signAccessToken(tokenPayload, String(session._id));
    await Promise.all([
      redisDelete(refreshCacheKey(tokenHash)),
      redisSetJson(
        refreshCacheKey(newTokenHash),
        {
          sid: String(session._id),
          user: session.user ? String(session.user) : undefined,
          guest: session.guest ? String(session.guest) : undefined,
        },
        REFRESH_TOKEN_TTL_SECONDS
      ),
      redisSetJson(
        sessionCacheKey(String(session._id)),
        {
          user: session.user ? String(session.user) : undefined,
          guest: session.guest ? String(session.guest) : undefined,
        },
        REFRESH_TOKEN_TTL_SECONDS
      ),
    ]);

    return { token: newToken, refreshToken: newRefreshToken };
  } catch (error: any) {
    console.error("Error refreshing session:", error);
    throw createError({
      statusMessage: error.statusMessage || "Failed to refresh session",
      // Preserve deliberate non-401 statuses (e.g. 429 rotation contention
      // so the client backs off and retries instead of logging out).
      statusCode: error.statusCode || 401,
    });
  }
};

/**
 * Creates or updates a session for a user.
 */
export const setSession = async (
  payload: ISetSessionParams
): Promise<ISessionSchema> => {
  try {
    const createdSession = await SessionModel.create({
        refreshTokenHash: hashRefreshToken(payload.refreshToken),
        user: payload.user,
        guest: payload.guest,
    });
    if (!createdSession) {
      throw createError({
        statusCode: 500,
        statusMessage: "Error creating session",
      });
    }
    const sessionId = String(createdSession._id);
    const tokenHash = hashRefreshToken(payload.refreshToken);
    await Promise.all([
      redisSetJson(
        refreshCacheKey(tokenHash),
        {
          sid: sessionId,
          user: payload.user ? String(payload.user) : undefined,
          guest: payload.guest ? String(payload.guest) : undefined,
        },
        REFRESH_TOKEN_TTL_SECONDS
      ),
      redisSetJson(
        sessionCacheKey(sessionId),
        {
          user: payload.user ? String(payload.user) : undefined,
          guest: payload.guest ? String(payload.guest) : undefined,
        },
        REFRESH_TOKEN_TTL_SECONDS
      ),
    ]);
    return createdSession;
  } catch (error: any) {
    throw error;
  }
};

export const exitSession = async (accessToken: string, refreshToken?: string) => {
  try {
    if (refreshToken) {
      const tokenHash = hashRefreshToken(refreshToken);
      const session = await SessionModel.findOne({
        $or: [{ refreshTokenHash: tokenHash }, { refreshToken: refreshToken }],
      });
      if (session) {
        await SessionModel.deleteOne({ _id: session._id });
        await redisDelete(sessionCacheKey(String(session._id)));
      }
      await redisDelete(refreshCacheKey(tokenHash));
      return true;
    }

    if (accessToken) {
      // Signature MUST be verified before trusting any claim — the previous
      // jwt.decode() allowed anyone to revoke arbitrary users' sessions with
      // a forged payload. Invalid signatures simply mean nothing to revoke.
      let decoded: jwt.JwtPayload | null = null;
      try {
        decoded = jwt.verify(accessToken, getSecretKey()) as jwt.JwtPayload;
      } catch {
        return true;
      }

      if (decoded.sid) {
        await SessionModel.deleteOne({ _id: decoded.sid });
        await redisDelete(sessionCacheKey(String(decoded.sid)));
      } else if (decoded.user) {
        await SessionModel.deleteMany({ user: decoded.user });
      } else if (decoded.guest) {
        await SessionModel.deleteMany({ guest: decoded.guest });
      }
    }
    return true;
  } catch (error: any) {
    return error;
  }
};
