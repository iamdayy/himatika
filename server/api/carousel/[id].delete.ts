import { deleteFromR2 } from "~~/server/utils/storage";
import { CarouselModel } from "~~/server/models/CarouselModel";
import { PhotoModel } from "~~/server/models/PhotoModel";
import type { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({ statusCode: 403, statusMessage: "Anda harus login" });
    }
    const organizer = event.context.organizer;
    if (!organizer) {
      throw createError({ statusCode: 403, statusMessage: "Anda harus admin / departement" });
    }

    const id = getRouterParam(event, 'id');
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: "ID carousel tidak disertakan" });
    }

    const carousel = await CarouselModel.findByIdAndDelete(id);
    if (!carousel) {
      throw createError({ statusCode: 404, statusMessage: "Carousel tidak ditemukan" });
    }

    // Attempt to delete associated photo if exists
    if (carousel.image) {
      const photoId = typeof carousel.image === 'object' ? carousel.image._id : carousel.image;
      if (photoId) {
          const photo = await PhotoModel.findByIdAndDelete(photoId);
          if (photo && photo.image) {
            try {
                await deleteFromR2(photo.image as string);
            } catch (e) {
                console.error("Failed to delete from S3:", e);
            }
          }
      }
    }

    return { statusCode: 200, statusMessage: "Carousel berhasil dihapus" };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Terjadi Kesalahan Server",
    };
  }
});
