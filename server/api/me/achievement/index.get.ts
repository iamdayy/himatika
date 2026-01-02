import { PointModel } from "~~/server/models/PointModel";

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    // Mengambil data achievement milik user yang sedang login, diurutkan dari yang terbaru
    const achievements = await PointModel.find({
      member: user.member._id,
    }).sort({ date: -1 });

    return achievements;
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e.message });
  }
});
