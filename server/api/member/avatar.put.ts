import { PutObjectCommand } from "@aws-sdk/client-s3"; // Ganti import Vercel
import { MemberModel } from "~~/server/models/MemberModel";
import { IResponse } from "~~/types/IResponse";

// Gunakan util R2 Client yang sudah dibuat sebelumnya
import { R2_BUCKET_NAME, R2_PUBLIC_DOMAIN, r2Client } from "~~/server/utils/r2";

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
    // Hapus slash di depan agar sesuai standar S3 Key
    const BASE_AVATAR_FOLDER = "uploads/img/avatars";

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

    // Process and save the new avatar
    // Generate nama file (Key)
    const fileName = `${BASE_AVATAR_FOLDER}/${member.NIM}.${
      avatarFile.type?.split("/")[1] || "png"
    }`;

    if (avatarFile.type?.startsWith("image/")) {
      // --- UPLOAD KE R2 ---
      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: fileName,
          Body: avatarFile.data,
          ContentType: avatarFile.type,
        })
      );

      // Susun URL Publik R2
      const imageUrl = `${R2_PUBLIC_DOMAIN}/${fileName}`;

      // Update member dengan URL baru
      member.avatar = imageUrl;
      await member.save();
      // --------------------
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid file type: Please upload an image file",
      });
    }

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
