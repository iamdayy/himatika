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
    
    // Upsert logic: Update the first config document if exists, else create new
    const config = await ConfigModel.findOneAndUpdate({}, body, { 
        new: true, 
        upsert: true, 
        sort: { _id: 1 } 
    });

    try {
        await useStorage('cache').removeItem('nitro:handlers:config-cache:/api/config.json');
    } catch (e) {
        // Ignore cache clear error
    }

    return {
      statusCode: 200,
      statusMessage: "Config berhasil diperbarui",
      data: config as unknown as IConfig,
    };
  } catch (error: any) {
    console.error(error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
});
