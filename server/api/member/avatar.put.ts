import { del, put } from "@vercel/blob";
import { MemberModel } from "~~/server/models/MemberModel";
import { IResponse } from "~~/types/IResponse";
const config = useRuntimeConfig();

/**
 * Handles PUT requests for updating a user's avatar.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<Object>} An object containing the status code, message, and updated avatar URL.
 * @throws {H3Error} If the user is not authorized, the member is not found, or if a system error occurs.
 */
export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const { NIM } = getQuery(event);
    const body = await readMultipartFormData(event);
    if (!body) {
      throw createError({
        statusCode: 400,
        statusMessage: "No file uploaded",
      });
    }

    const avatarFile = body[0]!;
    const BASE_AVATAR_FOLDER = "/uploads/img/avatars";
    let imageUrl = "";

    // Ensure the user is authenticated and authorized
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be logged in to use this endpoint",
      });
    }
    if (user.member.NIM != NIM) {
      throw createError({
        statusCode: 403,
        statusMessage:
          "Unauthorized: You can only update your own member avatar",
      });
    }

    // Find the user's member
    const member = await MemberModel.findOne({ NIM });
    if (!member) {
      throw createError({
        statusCode: 404,
        statusMessage: "Member not found",
      });
    }

    // Remove old avatar if it exists
    if (member.avatar) {
      const oldAvatarurl = member.avatar;
      await del(oldAvatarurl);
    }

    // Process and save the new avatar
    // const buffer = Buffer.from(avatarFile.content, "base64");
    const fileName = `${BASE_AVATAR_FOLDER}/${hashText(`${member.NIM}`)}.${
      avatarFile.type?.split("/")[1] || "png"
    }`;

    if (avatarFile.type?.startsWith("image/")) {
      const { url } = await put(fileName, avatarFile.data, {
        access: "public",
      });
      imageUrl = url;
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid file type: Please upload an image file",
      });
    }

    // Update the member with the new avatar URL
    member.avatar = imageUrl;
    await member.save();

    return {
      statusCode: 200,
      statusMessage: `Avatar for user ${member.NIM} updated successfully`,
    };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage:
        error.message ||
        "An unexpected error occurred while updating the avatar",
    };
  }
});
