import fs from "fs";
import path from "path";
import { NewsModel } from "~~/server/models/NewsModel";
import { IResponse } from "~~/types/IResponse";

const config = useRuntimeConfig();

/**
 * Handles DELETE requests for removing a news.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<Object>} An object containing the status code and message of the operation.
 * @throws {H3Error} If the user is not authorized, the news is not found, or if a system error occurs.
 */
export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    // Ensure the user is authenticated and has the necessary permissions
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

    // Get the news slug from the query parameters
    const { slug } = getQuery(event);

    // Find the news by slug
    const news = await NewsModel.findOne({ slug });
    if (!news) {
      throw createError({
        statusCode: 404,
        message: "News not found",
      });
    }

    // Delete the associated main image file if it exists
    if (news.mainImage) {
      const imagePath = path.join(config.storageDir, news.mainImage as string);
      if (fs.existsSync(imagePath)) {
        deleteFile(news.mainImage as string);
      }
    }

    // Delete the news from the database
    await NewsModel.findOneAndDelete({ slug });

    // Return success response
    return {
      statusCode: 200,
      statusMessage: `News "${news.title}" successfully deleted`,
    };
  } catch (error: any) {
    // Handle any errors that occur during the process
    return {
      statusCode: error.statusCode || 500,
      statusMessage:
        error.message || "An unexpected error occurred while deleting the news",
    };
  }
});
