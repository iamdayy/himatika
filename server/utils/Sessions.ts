import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { ISetSessionParams } from "~~/types/IParam";
import { SessionModel } from "../models/SessionModel";
import { UserModel, UserPopulateOptions } from "../models/UserModel";

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
 * Tokens issued after the rotation upgrade carry a `sid` claim bound to a
 * specific Session row, so revocation of one session no longer leaves every
 * other access token valid (the old code only checked that ANY row existed
 * for the user).
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
      // Bound to an exact session: revoked session == revoked token.
      const session = await SessionModel.findOne({ _id: decoded.sid });
      if (
        !session ||
        (decoded.user && String((session.user as any)?._id ?? session.user) !== String(decoded.user)) ||
        (decoded.guest && String((session.guest as any)?._id ?? session.guest) !== String(decoded.guest))
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

export const ACCESS_TOKEN_TTL_SECONDS = 3600; // 60m
export const REFRESH_TOKEN_TTL_SECONDS = 7776000; // 90d
/** Window where a just-rotated refresh token is still honored. */
export const REFRESH_GRACE_WINDOW_MS = 10 * 60 * 1000;

export const signAccessToken = (tokenPayload: Record<string, unknown>, sid?: string) =>
  jwt.sign({ ...tokenPayload, ...(sid ? { sid } : {}) }, getSecretKey(), {
    expiresIn: "60m",
  });

export const signRefreshToken = (subject: { user?: unknown; guest?: unknown }) =>
  jwt.sign(
    { ...subject, jti: randomBytes(16).toString("hex") },
    getSecretKey(),
    { expiresIn: "90d" }
  );

const buildTokenPayload = async (session: {
  user?: unknown;
  guest?: unknown;
}) => {
  let memberPayload = null;
  let guestPayload = null;
  let username = null;

  if (session.user) {
    // Do the heavy populate once per refresh
    const user = await UserModel.findById(session.user).populate(
      UserPopulateOptions
    );

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
        organizer: m.organizer
          ? { role: m.organizer.role, period: m.organizer.period }
          : null,
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

  return {
    user: session.user,
    guest: session.guest,
    username,
    member: memberPayload,
  };
};

/**
 * Refreshes a session: rotates the refresh token and issues a fresh access
 * token bound (`sid`) to the rotated session row.
 *
 * A just-rotated refresh token is still honored inside the grace window so
 * concurrent refreshes (multi-tab, periodic + on-401 racing) do not nuke
 * the session. Outside the window, reuse is treated as a theft signal and
 * only the affected session is revoked.
 */
export const refreshSession = async (payload: string) => {
  try {
    const decoded = jwt.verify(payload, getSecretKey()) as jwt.JwtPayload;
    if (!decoded || (!decoded.user && !decoded.guest)) {
      throw createError({ statusMessage: "Invalid Token", statusCode: 401 });
    }

    let session = await SessionModel.findOne({
      refreshToken: payload
    });

    if (!session) {
      // Maybe a concurrent refresh already rotated this token: honor the
      // previous token inside the grace window by returning fresh tokens
      // for the already-rotated session instead of revoking anything.
      const rotated = await SessionModel.findOne({
        previousRefreshToken: payload,
      });
      if (
        rotated?.rotatedAt &&
        Date.now() - new Date(rotated.rotatedAt).getTime() <= REFRESH_GRACE_WINDOW_MS
      ) {
        const retryPayload = await buildTokenPayload(rotated);
        const retryToken = signAccessToken(retryPayload, String(rotated._id));
        return { token: retryToken, refreshToken: rotated.refreshToken };
      }

      // Outside the grace window this looks like real reuse: revoke only
      // the affected session instead of every session of the subject.
      if (rotated) {
        await SessionModel.deleteOne({ _id: rotated._id });
      }
      throw createError({
        statusMessage: "Session not found or invalid",
        statusCode: 401,
      });
    }

    const tokenPayload = await buildTokenPayload(session);

    const newToken = signAccessToken(tokenPayload, String(session._id));

    // Rotate with grace: keep the presented token as previousRefreshToken so
    // concurrent refreshes racing each other still succeed inside the window.
    // A random jti is REQUIRED — signing identical static claims yields a
    // byte-identical JWT, which would make the rotation a no-op.
    session.previousRefreshToken = payload;
    session.refreshToken = signRefreshToken({ user: session.user, guest: session.guest });
    session.rotatedAt = new Date();
    await session.save();

    return { token: newToken, refreshToken: session.refreshToken };
  } catch (error: any) {
    console.error("Error refreshing session:", error);
    throw createError({
      statusMessage: error.statusMessage || "Failed to refresh session",
      statusCode: 401,
    });
  }
};

/**
 * Creates a session row for a user/guest and returns it so callers can bind
 * the access token to the exact session via the `sid` claim.
 */
export const setSession = async (payload: ISetSessionParams) => {
  try {
    const createdSession = await SessionModel.create({
      refreshToken: payload.refreshToken,
      user: payload.user,
      guest: payload.guest,
    });
    if (!createdSession) {
      throw createError({
        statusCode: 500,
        statusMessage: "Error creating session",
      });
    }
    return createdSession;
  } catch (error: any) {
    throw error;
  }
};

export const exitSession = async (accessToken: string, refreshToken?: string) => {
  try {
    if (refreshToken) {
      await SessionModel.deleteOne({ refreshToken });
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
