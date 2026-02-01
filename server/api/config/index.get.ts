import { ConfigModel } from "~~/server/models/ConfigModel";
import { IConfig } from "~~/types";
import type { IConfigResponse } from "~~/types/IResponse";
export default defineCachedEventHandler(
  async (event): Promise<IConfigResponse> => {
    try {
      const config = await ConfigModel.find().select("-_id");
      if (config.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: "No config found",
        });
      }
      const lastConfigItem = config[config.length - 1];
      return {
        statusCode: 200,
        statusMessage: "Success",
        data: lastConfigItem as IConfig,
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
