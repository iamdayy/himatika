import { PointModel } from "~~/server/models/PointModel";

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user?.member) {
      throw createError({
        statusCode: 403,
        statusMessage: "Hanya member yang memiliki riwayat poin",
      });
    }

    // Mengambil data achievement milik user yang sedang login, diurutkan dari yang terbaru
    const achievements = await PointModel.find({
      member: user.member._id,
    }).sort({ date: -1 });

    return achievements;
  } catch (e: any) {
    throw createError({
      statusCode: e.statusCode || 500,
      statusMessage: e.statusMessage || e.message || "Terjadi Kesalahan Server",
    });
  }
});
