import { DocModel } from "~~/server/models/DocModel";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IResponse & { data?: number }> => {
    try {
      // Ensure the user is authenticated
      const user = event.context.user;
      if (!user) {
        throw createError({
          statusCode: 403,
          statusMessage: "You must be logged in to use this endpoint",
        });
      }

      // Fetch the last documents number in this month
      const lastDoc = await DocModel.countDocuments({
        createdAt: {
          $exists: true,
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      });

      // Return the last document number or a default value if none exists
      return {
        statusCode: 200,
        statusMessage: "Last document number retrieved successfully",
        data: lastDoc ? lastDoc : 0,
      };
    } catch (error: any) {
      // Handle any errors that occur during the process
      return {
        statusCode: error.statusCode || 500,
        statusMessage: error.message || "An unexpected error occurred",
      };
    }
  }
);
