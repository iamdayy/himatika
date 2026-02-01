import { ConfigModel } from "~~/server/models/ConfigModel";
import type { IConfig } from "~~/types";
export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 403,
        statusMessage: "Anda harus login untuk menggunakan endpoint ini",
      });
    }
    if (!event.context.organizer) {
      throw createError({
        statusCode: 403,
        statusMessage: "Anda harus admin / departement untuk menggunakan endpoint ini",
      });
    }
    const body = await readBody<IConfig>(event);
    const config = await ConfigModel.create(body);
    return {
      statusCode: 200,
      statusMessage: "Config berhasil dibuat",
      data: config,
    };
  } catch (error: any) {
    console.error(error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
});
