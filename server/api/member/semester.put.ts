import { MemberModel } from "~~/server/models/MemberModel";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const organizer = event.context.organizer;
    if (!organizer) {
      throw createError({
        statusCode: 401,
        statusMessage: "You must be an organizer to access this method",
      });
    }
    const member = await MemberModel.updateMany(
      {}, // Filter criteria (empty object means all members)
      { $inc: { semester: 1 } } // Increment the semester field by 1
    );

    if (!member.acknowledged) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to update semester",
      });
    }
    return {
      statusCode: 200,
      statusMessage: `Update semester of ${member.modifiedCount} member successfully`,
    };
  } catch (error: any) {
    console.log(error);

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    });
  }
});
