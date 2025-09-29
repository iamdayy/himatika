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
        statusMessage: "You must be logged in to use this endpoint",
      });
    }
    if (!event.context.organizer) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be admin / departement to use this endpoint",
      });
    }

    // Find the news by slug
    const news = await NewsModel.findOne({ slug }, {}, { autopopulate: false });
    if (!news) {
      throw createError({
        statusCode: 404,
        statusMessage: "News not found",
      });
    }

    // Check if the news is already archived
    if (!news.archived) {
      // Publish the news
      news.archived = true;
      news.archivedAt = new Date();
      await news.save();
      return {
        statusCode: 200,
        statusMessage: `News "${news.title}" is archived`,
      };
    } else {
      news.archived = false;
      news.archivedAt = undefined;
      await news.save();
      return {
        statusCode: 200,
        statusMessage: `News "${news.title}" is unarchived`,
      };
    }

    // // Return error if the news is already archived
    // return {
    //   statusCode: 400,
    //   statusMessage: `News "${news.title}" is already archived`,
    // };
  } catch (error: any) {
    // Handle any errors that occur during the process
    return {
      statusCode: error.statusCode || 500,
      statusMessage:
        error.message ||
        "An unexpected error occurred while publishing the news",
    };
  }
});
