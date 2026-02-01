import type { IMeResponse } from "~~/types/IResponse";
import { UserModel } from "../../models/UserModel";
import { ensureAuth } from "../../utils/authHelper";

export default defineEventHandler(async (event): Promise<IMeResponse> => {
  // 1. Pastikan user login (Ringan, hanya cek token JWT & Lite Session)
  const sessionUser = await ensureAuth(event);

  if (!sessionUser.member || !sessionUser.member.NIM) {
    throw createError({
      statusCode: 404,
      statusMessage: "Member profile not found linked to this user.",
    });
  }

  // 2. Fetch Full Member Data (Heavy)
  // Gunakan NIM atau ID dari session untuk query ulang ke DB dengan Full Population
  // Karena UserModel memiliki default 'autopopulate' yang aktif, kita cukup findOne dengan user ID usernya
  // Namun, karena structure UserModel -> Member, kita cari usernya lagi agar dapat Member dengan virtuals-nya (points, agenda, etc)
  
  // Opsi A: Query Member langsung (tapi butuh ID member). Di session kita punya member object (poin 1).
  // Opsi B: Query User lalu ambil membernya (seperti cara lama tapi dedicated endpoint).
  
  // Kita pakai Opsi B agar konsisten dengan logic virtuals yang mungkin bergantung di User (konteks jarang, tapi aman).
  // ATAU lebih baik query MemberModel langsung jika ID member terekspos.
  // Di session lite (Sessions.ts), kita mengembalikan object member lean. 
  // Mongoose lean() object punya _id.
  
  // Cek apakah session.member punya _id?
  // Di Sessions.ts: select: "NIM fullName...". Default _id included.
  
  try {
    // Kita query UserModel full power (dengan autopopulate nyala sesuai default schema)
    const user = await UserModel.findOne({ username: sessionUser.username });
    
    if (!user || !user.member) {
       throw createError({
        statusCode: 404,
        statusMessage: "Member details not found.",
      });
    }

    // Return hanya bagian member karena 'me' biasanya konteks profile anggota
    // User wrapper hanya untuk auth info (username, email, role di User level kalau ada)
    return {
        statusCode: 200,
        statusMessage: "Member details retrieved successfully.",
        data: {
            user: {
              ...user.toJSON().member,
              username: sessionUser.username
            },
        }
    };

  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to retrieve full profile.",
    });
  }
});
