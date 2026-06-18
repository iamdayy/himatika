import { ConfigModel } from "~~/server/models/ConfigModel";
import { IConfig } from "~~/types";
import type { IConfigResponse } from "~~/types/IResponse";
export default defineCachedEventHandler(
  async (event): Promise<IConfigResponse> => {
    try {
      const config = await ConfigModel.findOne().sort({ _id: -1 }).select("-_id");
      if (!config) {
        throw createError({
          statusCode: 404,
          statusMessage: "No config found",
        });
      }
      return {
        statusCode: 200,
        statusMessage: "Success",
        data: config as unknown as IConfig,
      };
    } catch (error: any) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message,
      });
    }
  },
  {
    maxAge: 5 * 60, //Cache selama 5 Menit
    name: "config-cache",
    swr: true,
    getKey: (event) => event.path,
  }
);
