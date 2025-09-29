import { MemberModel } from "~~/server/models/MemberModel";
import type { IReqMember } from "~~/types/IRequestPost";
import { IResponse } from "~~/types/IResponse";
/**
 * Handles POST requests for creating a new user member.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<Object>} An object containing the status code and message of the operation.
 * @throws {H3Error} If the user is not authorized, the member is not saved, or if a system error occurs.
 */
export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    // Ensure the user is authenticated and has the necessary permissions
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be logged in to use this endpoint",
      });
    }
    if (!event.context.organizer) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be admin / departement to use this endpoint",
      });
    }

    // Read the request body containing the member data
    const body = await readBody<IReqMember>(event);

    // Create a new member instance and save it to the database
    const member = new MemberModel(body);
    const saved = await member.save();

    // Check if the member was successfully saved
    if (!saved) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to save the member data",
      });
    }

    // Return success message with the saved member's NIM
    return {
      statusCode: 200,
      statusMessage: `Member ${member.NIM} successfully saved!`,
    };
  } catch (error: any) {
    // Handle any errors that occur during the process
    return {
      statusCode: error.statusCode || 500,
      statusMessage:
        error.message || "An unexpected error occurred while saving the member",
    };
  }
});
