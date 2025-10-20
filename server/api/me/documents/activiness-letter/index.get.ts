import { IUser } from "~~/types";
import { IActivinessLetterResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IActivinessLetterResponse> => {
    try {
      // Ensure user is authenticated and authorized
      const user = event.context.user as IUser;
      if (!user) {
        throw createError({
          statusCode: 403,
          statusMessage: "You must be logged in to access this",
        });
      }

      const documents = user.member.documents?.filter((doc) =>
        doc.tags.includes("Surat Keterangan Aktif")
      );

      if (!documents || documents.length === 0) {
        return {
          statusCode: 404,
          statusMessage: "No active letters found",
        };
      }
      return {
        statusCode: 200,
        statusMessage: "Active letters fetched successfully",
        data: documents,
      };
    } catch (error) {
      console.error(
        "Error in /api/me/documents/activiness_letter/index.get.ts:",
        error
      );
      throw createError({
        statusCode: 500,
        statusMessage: "System error",
      });
    }
  }
);
