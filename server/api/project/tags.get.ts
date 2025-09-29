import { ProjectModel } from "~~/server/models/ProjectModel";
import { ITagsResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<ITagsResponse> => {
  try {
    const tags = await ProjectModel.distinct("tags");
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
