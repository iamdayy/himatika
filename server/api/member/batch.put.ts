import { MemberModel } from "~~/server/models/MemberModel";
import { IMember } from "~~/types";
import { IReqMemberBatch } from "~~/types/IRequestPost";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (
    event
  ): Promise<IResponse & { data?: { failedMembers: IMember[] } }> => {
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
        statusMessage:
          "You must be administrator or department to use this endpoint",
      });
    }

    // Read the request body containing an array of member data
    const body = await readBody<IReqMemberBatch>(event);

    // Attempt to insert multiple members into the database
    let savedCount = 0;
    let failedCount = 0;
    let failedMembers: IMember[] = []; // Array to store members that failed to save

    try {
      const result = await MemberModel.updateMany(
        { NIM: { $in: body.members } }, // Filter by member IDs
        { [body.field]: body.value }, // Update the specified field with the new value
        { ordered: false, throwOnValidationError: false }
      );

      savedCount = result.modifiedCount; // Count the number of successfully updated members
      if (result.upsertedCount) {
        savedCount += result.upsertedCount; // Add upserted members to the saved count
      }
      failedCount = body.members.length - savedCount; // Calculate the number of failed inserts
    } catch (error: any) {
      // Handle the error but do not throw it, allowing the response to continue
      if (error.writeErrors) {
        savedCount = body.members.length - error.writeErrors.length; // Count of successful inserts
        failedCount = error.writeErrors.length; // Count the number of failed inserts
        // Store data of members that failed to save
        failedMembers = error.writeErrors.map((writeError: any) => {
          const index = writeError.index; // Index of the member that failed
          return body.members[index]; // Get the member data from the original request
        });
      } else {
        failedCount = body.members.length; // If there's another type of error, assume all failed
      }
    }

    // Return success message with the number of inserted and failed members
    return {
      statusCode: 200,
      statusMessage: `Successfully saved ${savedCount} new college members. ${failedCount} members failed to save.`,
      data: { failedMembers },
    };
  }
);
