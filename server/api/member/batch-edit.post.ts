import { MemberModel } from "~~/server/models/MemberModel";
import { IMember } from "~~/types";
import { IResponse } from "~~/types/IResponse";

/**
 * Handles POST requests for batch updating user members via Excel import.
 */
export default defineEventHandler(
  async (
    event
  ): Promise<
    IResponse & {
      data?: {
        failedMembers: IMember[];
        savedCount: number;
        failedCount: number;
      };
    }
  > => {
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
    const body = await readBody<IMember[]>(event);

    let savedCount = 0;
    let failedCount = 0;
    let failedMembers: IMember[] = [];

    try {
      // Prepare bulkWrite operations
      const operations = body.map((member) => {
        const { NIM, ...rest } = member;
        const updateData: Record<string, any> = { ...rest };

        // Just to be absolutely safe, avoid updating _id if it slipped in
        delete updateData._id;

        // Clean email: if empty or null, remove it from updateData so it doesn't trigger E11000
        if (!updateData.email || (typeof updateData.email === 'string' && updateData.email.trim() === "")) {
            delete updateData.email;
        }

        return {
          updateOne: {
            filter: { NIM: NIM },
            update: { $set: updateData },
          },
        };
      });

      const result = await MemberModel.bulkWrite(operations, {
        ordered: false,
      });

      savedCount = result.modifiedCount + (result.upsertedCount || 0);
      failedCount = body.length - savedCount;

      // It's harder to get exactly which failed in a successful bulkWrite without errors, 
      // but if the count mismatches, some NIMs were likely not found.
      if (savedCount < body.length) {
          // We can't easily identify which ones were skipped without querying, 
          // but we won't throw an error for it.
      }

    } catch (error: any) {
      console.log(error);
      if (error.writeErrors) {
        savedCount = body.length - error.writeErrors.length;
        failedCount = error.writeErrors.length;
        failedMembers = error.writeErrors.map((writeError: any) => {
          const index = writeError.index;
          return body[index];
        });
      } else {
        failedCount = body.length;
      }
    }

    return {
      statusCode: 200,
      statusMessage: `Successfully updated ${savedCount} members. ${failedCount} members failed to update.`,
      data: { failedMembers, savedCount, failedCount },
    };
  }
);
