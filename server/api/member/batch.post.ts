import { MemberModel } from "~~/server/models/MemberModel";
import { IMember } from "~~/types";
import { IResponse } from "~~/types/IResponse";
/**
 * Handles POST requests for batch creation of user members.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<Object>} An object containing the status code and message of the operation.
 * @throws {H3Error} If the user is not authorized, no data is saved, or if a system error occurs.
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
    // try {
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

    // Clean up body to remove null or empty emails to prevent E11000 duplicate key error
    // Also calculate the correct semester automatically based on enteredYear
    const cleanedBody = body.map(member => {
      let currentMember = member;

      // Clean email
      if (!currentMember.email || currentMember.email.trim() === '') {
        const { email, ...rest } = currentMember;
        currentMember = rest as IMember;
      }

      // Calculate semester
      if (currentMember.enteredYear) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-11

        let sem = (currentYear - currentMember.enteredYear) * 2;
        if (currentMonth >= 8) { // Sept - Dec
          sem += 1;
        } else if (currentMonth >= 2) { // Mar - Aug
          sem += 0;
        } else { // Jan - Feb
          sem -= 1;
        }
        currentMember.semester = sem > 0 ? sem : 1;
      }

      return currentMember;
    });

    // Attempt to insert multiple members into the database
    let savedCount = 0;
    let failedCount = 0;
    let failedMembers: IMember[] = []; // Array untuk menyimpan anggota yang gagal disimpan

    try {
      const result = await MemberModel.insertMany(cleanedBody, {
        ordered: false,
        throwOnValidationError: false,
      });

      savedCount = result.length; // Count the number of successfully inserted members
    } catch (error: any) {
      console.log(error);
      // Handle the error but do not throw it, allowing the response to continue
      if (error.writeErrors) {
        savedCount = body.length - error.writeErrors.length; // Count of successful inserts
        failedCount = error.writeErrors.length; // Count the number of failed inserts
        // Simpan data anggota yang gagal disimpan
        failedMembers = error.writeErrors.map((writeError: any) => {
          const index = writeError.index; // Index anggota yang gagal
          return body[index]; // Ambil data anggota dari array body
        });
      } else {
        failedCount = body.length; // If there's another type of error, assume all failed
      }
    }

    // Return success message with the number of inserted and failed members
    return {
      statusCode: 200,
      statusMessage: `Successfully saved ${savedCount} new college members. ${failedCount} members failed to save.`,
      data: { failedMembers, savedCount, failedCount },
    };
  }
);
