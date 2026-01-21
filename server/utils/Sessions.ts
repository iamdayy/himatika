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
    // 1. Cari session berdasarkan Access Token ATAU Previous Access Token
    const session = await SessionModel.findOne({
      $or: [{ token: payload }, { previousToken: payload }],
    });

    if (!session) {
      throw createError({
        statusMessage: "Session expired or invalid",
        statusCode: 401,
      });
    }

    // 1.5 Cek Grace Period untuk Access Token
    if (session.previousToken === payload) {
      const timeDiff =
        new Date().getTime() - new Date(session.updatedAt as Date).getTime();
        
      // Grace period 20 detik untuk Access Token (mengatasi race condition refresh)
      if (timeDiff > 20000) {
         throw createError({
          statusMessage: "Access Token Expired (Grace Period Over)",
          statusCode: 401,
        });
      }
      // Jika < 20s, LANJUT (gunakan session ini seolah-olah valid)
    }

    // 2. Verifikasi Signature JWT
    // Kita verify payload dengan secret. 
    // Note: Jika tokennya "previousToken" (yg mungkin sudah expired secara waktu claims), 
    // kita mungkin perlu ignoreExpiration? 
    // Tapi biasanya refresh dilakukan SEBELUM expired, jadi token lama pun "signature" nya valid tapi belum expired.
    // Jika benar-benar expired, jwt.verify akan throw error. 
    // Solusi: Kita coba verify, jika TokenExpiredError TAPI masih dalam Grace Period DB, kita toleransi?
    // TIDAK, Access Token biasanya 1 hari (di kode existing). Jadi dalam 20 detik setelah refresh, 
    // token lama PASTI belum expired secara claims. Jadi aman verify biasa.
    jwt.verify(payload, getSecretKey());

    // 3. Ambil user dengan populate member (Lite version)
    // Kita disable autopopulate default User -> Member yang load semua project/agenda
    // Kita manual populate hanya field penting
    const user = await UserModel.findById(session.user)
      .select("username member")
      .populate({
        path: "member",
        populate: [
          {
            path: 'organizersConsiderationBoard'
          },
          {
            path: 'organizersDailyManagement'
          },
          {
            path: 'organizersDepartmentCoordinator'
          },
          {
            path: 'organizersDepartmentMembers'
          },
          // {
          //   path: 'organizer'
          // }
        ],
        select: "NIM fullName avatar email organizer status semester class sex",
        options: { autopopulate: false }, // Penting: Matikan autopopulate di level Member
      })

    if (!user) {
      throw createError({
        statusMessage: "User context not found",
        statusCode: 401,
      });
    }

    // 4. Return data yang bersih (Lite Session)
    return {
      username: user.username,
      member: user.member ? user.member : null,
    };
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
    const decoded = jwt.verify(payload, getSecretKey()) as jwt.JwtPayload;
    if (!decoded || !decoded.user) {
      throw createError({ statusMessage: "Invalid Token", statusCode: 401 });
    }

    // 1. Coba fetch session biasa untuk cek kondisi awal
    let session = await SessionModel.findOne({
      refreshToken: payload
    });

    if (!session) {
      throw createError({
        statusMessage: "Session not found or invalid",
        statusCode: 401,
      });
    }

    // Kita hanya update JIKA refreshToken di DB masih sama dengan payload (belum diubah orang lain)
    if (session.refreshToken === payload) {
      const newToken = jwt.sign({ user: session.user }, getSecretKey(), {
        expiresIn: "1d",
      });

      const updatedSession = await SessionModel.findOneAndUpdate(
        {
          _id: session._id,
          refreshToken: payload,
        },
        {
          $set: {
            token: newToken,
            previousToken: session.token,
            updatedAt: new Date(),
          },
        },
        { new: true } // Return dokumen baru
      );

      // Jika berhasil update (atomic)
      if (updatedSession) {
        return {
          token: newToken,
        };
      }
      throw createError({
         statusMessage: "Concurrent Refresh Failed",
         statusCode: 401,
      });
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
