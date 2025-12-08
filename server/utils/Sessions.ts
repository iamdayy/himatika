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
    // jwt.verify akan throw error otomatis jika expired/invalid
    jwt.verify(session.token, getSecretKey());

    // 3. Ambil user dengan populate member (asumsi member adalah relasi/field)
    // Menggunakan lean() untuk performa lebih cepat (return POJO, bukan Mongoose Document)
    const user: any = await UserModel.findById(session.user);

    if (!user) {
      throw createError({
        statusMessage: "User context not found",
        statusCode: 401,
      });
    }

    // 4. Return data yang bersih
    return {
      username: user.username,
      // Menggunakan spread operator agar tidak perlu update manual jika field member bertambah
      member: user.member ? user.member : null,
    };
  } catch (error: any) {
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
    // 1. Validasi signature token (meskipun expired/lama, signature harus asli)
    // Kita gunakan decode dulu atau verify dengan ignoreExpiration jika perlu,
    // tapi biasanya refresh token belum expired secara waktu, hanya status DB nya.
    const decoded = jwt.verify(payload, getSecretKey()) as jwt.JwtPayload;
    if (!decoded || !decoded.user) {
      throw createError({ statusMessage: "Invalid Token", statusCode: 401 });
    }

    // 2. Cari session berdasarkan Refresh Token SAAT INI atau SEBELUMNYA
    const session = await SessionModel.findOne({
      $or: [
        { refreshToken: payload },
        { previousRefreshToken: payload }, // Cek juga kolom history
      ],
    });

    if (!session) {
      // Token valid secara kriptografi tapi tidak ada di DB (Reuse Detection)
      // Ini berarti token sudah sangat lama atau dipalsukan.
      throw createError({
        statusMessage: "Session not found",
        statusCode: 401,
      });
    }

    // SKENARIO A: RACE CONDITION / GRACE PERIOD
    // Jika token yang dikirim adalah token SEBELUMNYA (yang baru saja diganti)
    if (session.previousRefreshToken === payload) {
      // Hitung selisih waktu sejak update terakhir
      const timeDiff =
        new Date().getTime() - new Date(session.updatedAt as Date).getTime();

      // Jika kurang dari 20 detik (Window Tolerance), anggap ini request parallel yang sah
      if (timeDiff < 20000) {
        // Kembalikan token yang SUDAH ADA (yang valid saat ini), JANGAN generate baru lagi
        return {
          token: session.token,
          refreshToken: session.refreshToken,
        };
      } else {
        // Jika sudah lebih dari 20 detik, ini mencurigakan (Replay Attack)
        await session.deleteOne(); // Hapus session demi keamanan
        throw createError({
          statusMessage: "Token Reuse Detected",
          statusCode: 401,
        });
      }
    }

    // SKENARIO B: ROTASI NORMAL
    // Jika token yang dikirim adalah token SAAT INI
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

    // Fallback jika tidak match keduanya
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
    // Opsional: Hapus session lama user ini jika ingin "Single Device Login"
    // await SessionModel.deleteMany({ user: payload.user });

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
    // Decode tanpa verify dulu untuk mengambil ID user, atau cari langsung by token
    const result = await SessionModel.deleteOne({ token: payload });
    return result;
  } catch (error: any) {
    return error;
  }
};
