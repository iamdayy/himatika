import { MemberModel } from "~~/server/models/MemberModel";
import { IResponse } from "~~/types/IResponse";

/**
 * Handles DELETE requests for marking a user member as deleted.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<Object>} An object containing the status code and message of the operation.
 * @throws {H3Error} If the user is not authorized, the member is not found, or if a system error occurs.
 */
export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    // Ensure the user is authenticated
    const { NIM } = getQuery(event);
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be logged in to use this endpoint",
      });
    }

    // Check if the user has permission to delete the member
    if (user.member.NIM != NIM && !event.context.organizer) {
      throw createError({
        statusCode: 403,
        statusMessage:
          "Unauthorized: You can only delete your own member or must be an administrator/department.",
      });
    }

    // Find the member by NIM
    const member = await MemberModel.findOne({ NIM });
    if (!member) {
      throw createError({
        statusCode: 404,
        statusMessage: "Member not found",
      });
    }

    // Mark the member as deleted
    member.status = "deleted";
    await member.save();

    return {
      statusCode: 200,
      statusMessage: `Member ${member.NIM} has been marked as deleted`,
    };
  } catch (error: any) {
    // Handle any errors that occur during the process
    return {
      statusCode: error.statusCode || 500,
      statusMessage:
        error.message ||
        "An unexpected error occurred while deleting the member",
    };
  }
});
