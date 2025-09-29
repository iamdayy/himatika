import CategoryModel from "~~/server/models/CategoryModel";
import { ICategory } from "~~/types";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<ICategory>(event);
    const { title, description, slug } = body;
    if (!title || !description || !slug) {
      throw createError({
        statusCode: 400,
        statusMessage: "Title, description, and slug are required",
      });
    }

    const category = new CategoryModel({
      title,
      description,
      slug,
    });
    await category.save();
    return {
      statusCode: 200,
      statusMessage: "Category created",
      data: {
        category: category.toObject(),
      },
    };
  } catch (error) {
    console.error("Error creating category:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
