import { PointModel } from "~~/server/models/PointModel";

export default defineEventHandler(async (event) => {
  try {
    const { status } = getQuery(event);

    let query: any = {};
    if (status) {
      query.status = status;
    }
    const achievements = await PointModel.find(query)
      .populate("member")
      .populate("admin")
      .sort({ date: -1 });

    return achievements;
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e.message });
  }
});
