import { PointModel } from "~~/server/models/PointModel";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const user = event.context.user;
    if (!user || !user.member.organizer) {
      throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    }

    const body = await readBody<{
      memberId: string;
      amount: number;
      reason: string;
      type: "achievement" | "activity";
      date?: string; // Opsional, default now
    }>(event);

    if (!body.memberId || !body.amount || !body.reason) {
      throw createError({
        statusCode: 400,
        statusMessage: "Data tidak lengkap",
      });
    }

    // Simpan Log Poin
    await PointModel.create({
      member: body.memberId,
      admin: user._id,
      amount: body.amount,
      reason: body.reason,
      type: body.type,
      date: body.date ? new Date(body.date) : new Date(),
    });

    return {
      statusCode: 200,
      statusMessage: "Poin berhasil ditambahkan ke riwayat member",
    };
  } catch (error: any) {
    console.error(error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
