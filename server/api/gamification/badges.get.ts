import { BadgeModel } from "~~/server/models/BadgeModel";

export default defineEventHandler(async (event) => {
  try {
    const badges = await BadgeModel.find().sort({ minPoints: 1 });
    return {
      statusCode: 200,
      statusMessage: "Badges fetched successfully",
      data: badges,
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch badges",
    });
  }
});
