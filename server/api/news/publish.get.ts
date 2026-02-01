import { NewsModel } from "~~/server/models/NewsModel";
import { IReqNewsQuery } from "~~/types/IRequestPost";
import type { IResponse } from "~~/types/IResponse";
/**
 * Handles GET requests for publishing a news.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<Object>} An object containing the status code and message of the operation.
 * @throws {H3Error} If the news is not found, the user is not authorized, or if a system error occurs.
 */
export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    // Get the slug from the query parameters
    const { slug } = getQuery<IReqNewsQuery>(event);

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
        statusMessage: "Anda harus menjadi admin / departemen untuk menggunakan endpoint ini",
      });
    }

    // Find the news by slug
    const news = await NewsModel.findOne({ slug }, {}, { autopopulate: false });
    if (!news) {
      throw createError({
        statusCode: 404,
        statusMessage: "Berita tidak ditemukan",
      });
    }

    // Check if the news is already published
    if (!news.published) {
      // Publish the news
      news.published = true;
      news.publishedAt = new Date();
      await news.save();
      return {
        statusCode: 200,
        statusMessage: `Berita "${news.title}" berhasil diterbitkan`,
      };
    } else {
      // Publish the news
      news.published = false;
      news.publishedAt = undefined;
      await news.save();
      return {
        statusCode: 200,
        statusMessage: `Berita "${news.title}" batal diterbitkan`,
      };
    }
  } catch (error: any) {
    // Handle any errors that occur during the process
    return {
      statusCode: error.statusCode || 500,
      statusMessage:
        error.message ||
        "Terjadi kesalahan yang tidak terduga saat menerbitkan berita",
    };
  }
});
