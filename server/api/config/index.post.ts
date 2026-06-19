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
    console.log("body", body);
    const config = await ConfigModel.find();
    console.log("config", config);
    if(!config || config.length === 0) {
        await ConfigModel.create(body);
    }else {
        await ConfigModel.updateOne({ _id: config[0]?._id }, body);
    }

    try {
        const storage = useStorage();
        const keys = await storage.getKeys();
        for (const key of keys) {
            if (key.includes('config-cache') || key.includes('api/config')) {
                await storage.removeItem(key);
            }
        }
    } catch (e) {
        console.error("Cache clear error:", e);
    }

    return {
      statusCode: 200,
      statusMessage: "Config berhasil diperbarui",
      data: body as unknown as IConfig,
    };
  } catch (error: any) {
    console.error(error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
});
