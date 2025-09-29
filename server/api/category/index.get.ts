import CategoryModel from "~~/server/models/CategoryModel";
import { IReqCategoryQuery } from "~~/types/IRequestPost";
import { ICategoriesResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<ICategoriesResponse> => {
    try {
      const { page, perPage, sort, order, search, slug } =
        getQuery<IReqCategoryQuery>(event);
      const query: any = {};
      if (slug) {
        const category = await CategoryModel.findOne({ slug });
        if (!category) {
          throw createError({
            statusCode: 404,
            statusMessage: "Category not found",
          });
        }
        return {
          statusCode: 200,
          statusMessage: "Category found",
          data: {
            category: category.toObject(),
            length: 1,
          },
        };
      }
      if (search) {
        query.title = { $regex: search, $options: "i" };
      }
      const skip = (Number(page) - 1) * Number(perPage);
      const limit = Number(perPage);
      const sortOpt: any = {};
      if (sort && order) {
        sortOpt[sort] = order === "asc" ? 1 : -1;
      }
      const length = await CategoryModel.countDocuments(query);
      const categories = await CategoryModel.find(query)
        .populate("agendas projects news")
        .skip(skip || 0)
        .limit(limit || 0)
        .sort(sortOpt);

      if (!categories) {
        throw createError({
          statusCode: 400,
          statusMessage: "No categories found",
        });
      }
      return {
        statusCode: 200,
        statusMessage: "Categories found",
        data: {
          categories: categories.map((category) => category.toObject()),
          length,
        },
      };
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Internal Server Error",
      });
    }
  }
);
