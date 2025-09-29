import { NewsModel } from "~~/server/models/NewsModel";
import type { ITagsResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<ITagsResponse> => {
  try {
    const tags = await NewsModel.find().distinct("tags");
    return {
      statusCode: 200,
      statusMessage: "Tags fetched successfully",
      data: {
        tags: tags,
        length: tags.length,
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      statusMessage: "Failed to fetch tags",
    };
  }
});
