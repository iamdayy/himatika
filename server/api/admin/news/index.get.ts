import { CommentModel } from "~~/server/models/CommentModel";
import { NewsModel } from "~~/server/models/NewsModel";
import { IReqNewsQuery } from "~~/types/IRequestPost";
import type { INewsResponse } from "~~/types/IResponse";

/**
 * Handles GET requests for retrieving newss.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<Object>} The news data or an array of newss with total count.
 * @throws {H3Error} If an error occurs during the process.
 */
export default defineEventHandler(
  async (event): Promise<INewsResponse> => {
    try {
      const {
        perPage,
        page,
        slug,
        sort,
        order,
        category,
        tags,
        search,
        notPublished,
        archived,
      } = getQuery<IReqNewsQuery>(event);

      // Jika slug disediakan, ambil satu berita
      if (slug) {
        const news = await NewsModel.findOne({ slug }).populate({
          path: "comments",
          model: CommentModel,
        });
        if (!news) {
          throw createError({
            statusCode: 404,
            statusMessage: "News not found",
          });
        }

        // Cari berita terkait
        const relatedNews = await news.findRelated();

        return {
          statusCode: 200,
          statusMessage: "News fetched",
          data: {
            news: { ...news.toJSON(), related: relatedNews },
            length: 1,
          },
        };
      }

      // Set up query for multiple newss
      let query: any = {};

      if (category && JSON.parse(category).length > 0) {
        query.category = { $in: JSON.parse(category) };
      }

      if (tags && JSON.parse(tags).length > 0) {
        query.tags = { $in: JSON.parse(tags) };
      }

      if (search) {
        query.title = { $regex: search, $options: "i" };
      }

      let sortOpt = {};

      // Apply sorting if provided
      if (order && sort) {
        sortOpt = { [sort]: order };
      }

      // Check user authentication and permissions
      if (!event.context.organizer) {
        // If not an organizer, filter out unpublished and archived news
        query.published = true; // Fetch only published news
        query.archived = false; // Fetch only non-archived news
      } else {
        // If the user is an organizer, allow fetching all news regardless of published or archived status
        if (archived == "false") {
          query.archived = false; // Only show non-archived news
        }

        if (notPublished == "false") {
          query.published = true; // Allow fetching unpublished news if specified
        }
      }

      // Count total number of newss matching the query
      const newssLength = await NewsModel.countDocuments(query);

      // Fetch newss with pagination and sorting
      const news = await NewsModel.find(query)
        .skip((Number(page) - 1) * Number(perPage))
        .limit(Number(perPage))
        .sort(sortOpt);

      // Return newss and total count
      return {
        statusCode: 200,
        statusMessage: "News fetched",
        data: {
          news,
          length: newssLength,
        },
      };
    } catch (error: any) {
      // Handle any errors that occur during the process
      return {
        statusCode: error.statusCode || 500,
        statusMessage:
          error.message || "An unexpected error occurred while fetching news",
      };
    }
  }
);
