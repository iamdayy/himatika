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
    const config = await ConfigModel.findOneAndUpdate({}, { $set: body }, { 
        new: true, 
        upsert: true, 
        sort: { _id: -1 },
        runValidators: true
    });
    
    const fs = require('fs');
    fs.writeFileSync('debug.log', JSON.stringify({ body, config }));

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
