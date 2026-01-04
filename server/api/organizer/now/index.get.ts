import OrganizerModel from "~~/server/models/OrganizerModel";
import { IOrganizerResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IOrganizerResponse> => {
    try {
      const organizer = await OrganizerModel.findOne({
        "period.start": { $lte: new Date() },
        "period.end": { $gte: new Date() },
      });
      if (!organizer) {
        throw createError({
          statusCode: 404,
          statusMessage: "Organizer not found",
        });
      }
      return {
        statusCode: 200,
        statusMessage: "Organizer fetched successfully.",
        data: {
          organizer: organizer,
        },
      };
    } catch (error: any) {
      console.error(error);
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.message || "Internal server error.",
      });
    }
  }
);
