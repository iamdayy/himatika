import { VideoModel } from "~~/server/models/VideoModel";
import { ITagsResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<ITagsResponse> => {
  try {
    const tags = await VideoModel.distinct("tags");
    return {
      statusCode: 200,
      statusMessage: "Success",
      data: {
        tags,
        length: tags.length,
      },
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      statusMessage: "Internal Server Error",
    };
  }
});
