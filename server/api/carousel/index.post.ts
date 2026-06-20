import { CarouselModel } from "~~/server/models/CarouselModel";
import type { ICarousel } from "~~/types";
import type { IResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IResponse & { data?: ICarousel }> => {
    try {
      const user = event.context.user;
      if (!user) {
        throw createError({
          statusCode: 403,
          statusMessage: "Anda harus login",
        });
      }
      const organizer = event.context.organizer;
      if (!organizer) {
        throw createError({
          statusCode: 403,
          statusMessage: "Anda harus admin / departement",
        });
      }

      const body = await readBody<ICarousel>(event);
      const carousel = await CarouselModel.create(body);

      // Re-fetch to autopopulate the image
      const populated = await CarouselModel.findById(carousel._id);

      return {
        statusCode: 200,
        statusMessage: "Carousel berhasil ditambahkan",
        data: populated as unknown as ICarousel,
      };
    } catch (error: any) {
      console.error(error);
      throw createError({
        statusCode: 500,
        statusMessage: error.message || "Gagal menyimpan carousel",
      });
    }
  }
);
