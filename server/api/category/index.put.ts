import CategoryModel from "~~/server/models/CategoryModel";
import { ICategory } from "~~/types";
import { IReqCategoryQuery } from "~~/types/IRequestPost";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const { slug } = getQuery<IReqCategoryQuery>(event);
    const body = await readBody<ICategory>(event);
    if (!body.title || !body.description || !slug) {
      throw createError({
        statusCode: 400,
        statusMessage: "Title, description, and slug are required",
      });
    }
    const existingCategory = await CategoryModel.findOne({ slug });
    if (!existingCategory) {
      throw createError({
        statusCode: 404,
        statusMessage: "Category not found",
      });
    }
    const { title, description } = body;
    existingCategory.title = title;
    existingCategory.description = description;

    existingCategory.save();
    return {
      statusCode: 200,
      statusMessage: "Category created",
    };
  } catch (error) {
    console.error("Error creating category:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
