import { ConfigModel } from "~~/server/models/ConfigModel";
import type { IConfig } from "~~/types";
export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be logged in to use this endpoint",
      });
    }
    if (!event.context.organizer) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be admin / departement to use this endpoint",
      });
    }
    const body = await readBody<IConfig>(event);
    const config = await ConfigModel.create(body);
    return {
      statusCode: 200,
      statusMessage: "Config created",
      data: config,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
});
