import { DocModel } from "~~/server/models/DocModel";
import { IUser } from "~~/types";
import { IActivinessLetterResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IActivinessLetterResponse> => {
    try {
      // Ensure user is authenticated and authorized
      const user = event.context.user as IUser;
      if (!user || !user.member) {
        throw createError({
          statusCode: 403,
          statusMessage: "You must be logged in to access this",
        });
      }

      const documents = await DocModel.find({
        uploader: (user.member as any)._id || (user.member as any).id,
        tags: { $in: ["Surat Keterangan Aktif"] },
        archived: { $ne: true },
      })
        .populate("signs.user", "fullName NIM avatar")
        .lean();

      if (!documents || documents.length === 0) {
        return {
          statusCode: 404,
          statusMessage: "No active letters found",
        };
      }
      return {
        statusCode: 200,
        statusMessage: "Active letters fetched successfully",
        data: documents as any,
      };
    } catch (error: any) {
      console.error(
        "Error in /api/me/documents/activiness_letter/index.get.ts:",
        error
      );
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || "System error",
      });
    }
  }
);
