import { MemberModel } from "~~/server/models/MemberModel";

export default defineEventHandler(async (event) => {
  try {
    const t = await useTranslationServerMiddleware(event);
    const { NIM } = await readBody(event);
    const member = await MemberModel.findOne({ NIM });
    if (!member) {
      throw createError({
        statusCode: 404,
        statusMessage: t("register_page.nim_not_found"),
        data: { message: t("register_page.check_nim"), path: "NIM" },
      });
    }
    if (member.status !== "free") {
      throw createError({
        statusCode: 403,
        statusMessage: t("register_page.member_not_free"),
        data: { message: t("register_page.check_member"), path: "NIM" },
      });
    }
    return {
      statusCode: 200,
      statusMessage: t("register_page.member_free"),
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
