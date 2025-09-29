import { MemberModel } from "~~/server/models/MemberModel";

export default defineEventHandler(async (event) => {
  try {
    const { NIM } = await readBody(event);
    const member = await MemberModel.findOne({ NIM });
    if (!member) {
      throw createError({
        statusCode: 404,
        statusMessage: "Member not found",
        data: { message: "Please check your NIM", path: "NIM" },
      });
    }
    if (member.status !== "free") {
      throw createError({
        statusCode: 403,
        statusMessage: "Member is not available",
        data: { message: "Member is not available", path: "NIM" },
      });
    }
    return {
      statusCode: 200,
      statusMessage: "Member found",
      status: true,
    };
  } catch (error: any) {
    return createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
      data: error.data || {},
    });
  }
});
