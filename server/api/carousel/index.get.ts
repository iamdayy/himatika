import { CarouselModel } from "~~/server/models/CarouselModel";
import type { ICarousel } from "~~/types";
import type { IResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IResponse & { data?: ICarousel[] }> => {
    try {
      const carousels = await CarouselModel.find().sort({ date: -1 });
      return {
        statusCode: 200,
        statusMessage: "Success",
        data: carousels as unknown as ICarousel[],
      };
    } catch (error: any) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message,
      });
    }
  }
);
