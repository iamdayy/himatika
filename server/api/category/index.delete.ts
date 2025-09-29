import CategoryModel from "~~/server/models/CategoryModel";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const { slug } = getQuery(event);
    if (!slug) {
      throw createError({
        statusCode: 400,
        statusMessage: "Slug is required",
      });
    }
    const category = await CategoryModel.findOneAndDelete({ slug });
    if (!category) {
      throw createError({
        statusCode: 404,
        statusMessage: "Category not found",
      });
    }
    return {
      statusCode: 200,
      statusMessage: "Category deleted",
    };
  } catch (error) {
    console.error("Error deleting category:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
