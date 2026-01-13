import { H3Error } from "h3";
import jwt from "jsonwebtoken";
import { ISetSessionParams } from "~~/types/IParam";
import { SessionModel } from "../models/SessionModel";
import { UserModel } from "../models/UserModel";

const getSecretKey = () => {
  const secretKey = useRuntimeConfig().jwtSecret;
  if (!secretKey) {
    throw new Error("JWT secret key is not configured.");
  }
  return secretKey;
};

/**
 * Checks the validity of a session token.
 */
export const checkSession = async (payload: string) => {
  try {
    // 1. Cari session berdasarkan Access Token
    const session = await SessionModel.findOne({ token: payload });

    if (!session) {
      throw createError({
        statusMessage: "Session expired or invalid",
        statusCode: 401,
      });
    }

    // 2. Verifikasi Signature JWT
    jwt.verify(session.token, getSecretKey());

    // 3. Ambil user dengan POPULATE MANUAL (Explicit Loading)
    const user: any = await UserModel.findById(session.user)
      .select("username member") // Hanya ambil field ini dari User
      .populate({
        path: "member",
        // Pilih field ringan saja. HINDARI field berat (projects, agendas, points)
        populate: [
          {
            path: "organizersDailyManagement",
            select: "period position",
          },
          {
            path: "organizersDepartmentCoordinator",
            select: "period",
          },
          {
            path: "organizersDepartmentMembers",
            select: "period",
          },
          {
            path: "organizersConsiderationBoard",
            select: "period",
          },
        ],
        select: "fullName NIM email avatar status class semester sex organizer",
      });

    const userObj = user.toObject();
    if (userObj.member) {
      delete userObj.member.organizersDailyManagement;
      delete userObj.member.organizersConsiderationBoard;
      delete userObj.member.organizersDepartmentCoordinator;
      delete userObj.member.organizersDepartmentMembers;
      delete userObj.member.point;

      // Virtual 'organizer' (hasil gabungan) SUDAH TERSIMPAN di userObj.member.organizer
      // karena kita menggunakan toObject() yang mengaktifkan virtuals.
    }
    if (!user) {
      throw createError({
        statusMessage: "User context not found",
        statusCode: 401,
      });
    }

    // 4. Return data yang bersih
    return userObj;
  } catch (error: any) {
    console.log(error);
    // Jika error dari JWT (expired), kita lempar 401
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
 * Refreshes a session with Grace Period logic for Race Conditions.
 */
export const refreshSession = async (payload: string) => {
  try {
    // 1. Validasi signature token
    const decoded = jwt.verify(payload, getSecretKey()) as jwt.JwtPayload;
    if (!decoded || !decoded.user) {
      throw createError({ statusMessage: "Invalid Token", statusCode: 401 });
    }

    // 2. Cari session berdasarkan Refresh Token
    const session = await SessionModel.findOne({
      $or: [{ refreshToken: payload }, { previousRefreshToken: payload }],
    });

    if (!session) {
      throw createError({
        statusMessage: "Session not found",
        statusCode: 401,
      });
    }

    // SKENARIO A: RACE CONDITION / GRACE PERIOD
    if (session.previousRefreshToken === payload) {
      const timeDiff =
        new Date().getTime() - new Date(session.updatedAt as Date).getTime();

      if (timeDiff < 20000) {
        // 20 Detik Window
        return {
          token: session.token,
          refreshToken: session.refreshToken,
        };
      } else {
        await session.deleteOne();
        throw createError({
          statusMessage: "Token Reuse Detected",
          statusCode: 401,
        });
      }
    }

    // SKENARIO B: ROTASI NORMAL
    if (session.refreshToken === payload) {
      const newToken = jwt.sign({ user: session.user }, getSecretKey(), {
        expiresIn: "1d",
      });

      // Update token baru
      session.token = newToken;
      await session.save();

      return {
        token: newToken,
        refreshToken: session.refreshToken,
      };
    }

    throw createError({
      statusMessage: "Invalid Session State",
      statusCode: 401,
    });
  } catch (error: any) {
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
    const createdSession = await SessionModel.create(payload);
    if (!createdSession) {
      throw createError({
        statusCode: 500,
        statusMessage: "Error creating session",
      });
    }
    return true;
  } catch (error: any) {
    return error;
  }
};

export const exitSession = async (payload: string) => {
  try {
    const result = await SessionModel.deleteOne({ token: payload });
    return result;
  } catch (error: any) {
    return error;
  }
};
