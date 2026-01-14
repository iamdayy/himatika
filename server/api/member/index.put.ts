import { MemberModel } from "~~/server/models/MemberModel";
import { IMember } from "~~/types";
import { IResponse } from "~~/types/IResponse";
/**
 * Handles PUT requests for updating a user member.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<Object>} An object containing the status code and message of the operation.
 * @throws {H3Error} If the user is not authorized, the member is not found, or if a system error occurs.
 */
export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const { NIM } = getQuery(event);

    // Ensure the user is authenticated
    const user = event.context.user;
    const organizer = event.context.organizer;
    if (!user) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be logged in to use this endpoint",
      });
    }
    // Check if the user is updating their own member
    if (user.member.NIM != NIM && !organizer) {
      throw createError({
        statusCode: 403,
        statusMessage:
          "Unauthorized: You can only update your own member / as an organizer",
      });
    }

    const body = await readBody<IMember>(event);

    const allowedFields = {
      fullName: body.fullName,
      email: body.email, // Pastikan ada validasi email unik di model/tempat lain
      phone: body.phone,
      class: body.class,
      semester: body.semester,
      religion: body.religion,
      birth: body.birth,
      address: body.address,
    };
    // Read the request body containing the updated member data
    const updateData = Object.fromEntries(
      Object.entries(allowedFields).filter(([_, v]) => v !== undefined)
    );
    // Find the member by NIM
    const member = await MemberModel.updateOne(
      { NIM: Number(NIM) },
      { $set: updateData }
    );

    if (!member) {
      throw createError({
        statusCode: 404,
        statusMessage: "Member not found",
      });
    }
    if (!member.acknowledged) {
      throw createError({
        statusCode: 500,
        statusMessage: "System error: Failed to update member",
      });
    }

    // // Update member fields
    // member.fullName = body.fullName;
    // member.avatar = body.avatar;
    // member.email = body.email;
    // member.class = body.class;
    // member.citizen = body.citizen;
    // member.semester = body.semester;
    // member.sex = body.sex;
    // member.religion = body.religion;
    // member.phone = body.phone;
    // member.birth = body.birth;

    // // Save the updated member
    // await member.save();

    // Return success message
    return {
      statusCode: 200,
      statusMessage: `Member ${NIM} updated successfully`,
    };
  } catch (error: any) {
    // Handle any errors that occur during the process
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage:
        error.message ||
        "An unexpected error occurred while updating the member",
    });
  }
});
