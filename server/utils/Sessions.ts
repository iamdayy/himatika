import { H3Error } from "h3";
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
 * Checks the validity of a session token (Stateless).
 */
export const checkSession = async (payload: string) => {
  try {
    // Verifikasi Signature JWT murni tanpa DB hit
    const decoded = jwt.verify(payload, getSecretKey()) as jwt.JwtPayload;
    if (!decoded || (!decoded.user && !decoded.guest)) {
      throw createError({
        statusMessage: "Invalid Session Data",
        statusCode: 401,
      });
    }

    // Stateful check to ensure the session hasn't been revoked
    const query = decoded.user ? { user: decoded.user } : { guest: decoded.guest };
    const sessionExists = await SessionModel.exists(query);
    if (!sessionExists) {
      throw createError({
        statusMessage: "Session revoked",
        statusCode: 401,
      });
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

/**
 * Refreshes a session with heavy populate & lean payload injection.
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
      throw createError({
        statusMessage: "Session not found or invalid",
        statusCode: 401,
      });
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
    
    const newToken = jwt.sign(tokenPayload, getSecretKey(), {
      expiresIn: "60m",
    });

    return { token: newToken, refreshToken: payload };
  } catch (error: any) {
    console.error("Error refreshing session:", error);
    throw createError({
      statusMessage: error.message || "Failed to refresh session",
      statusCode: 401,
    });
  }
};

/**
 * Creates or updates a session for a user.
 */
export const setSession = async (
  payload: ISetSessionParams
): Promise<true | H3Error> => {
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
    return true;
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
      // Fallback: hapus semua session user jika refresh token tidak ditemukan
      const decoded = jwt.decode(accessToken) as any;
      if (decoded?.user) {
        await SessionModel.deleteMany({ user: decoded.user });
      } else if (decoded?.guest) {
        await SessionModel.deleteMany({ guest: decoded.guest });
      }
    }
    return true;
  } catch (error: any) {
    return error;
  }
};
