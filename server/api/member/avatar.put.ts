import { uploadToR2, StoragePaths } from "~~/server/utils/storage";
import { MemberModel } from "~~/server/models/MemberModel";
import { IResponse } from "~~/types/IResponse";

// Gunakan util R2 Client yang sudah dibuat sebelumnya
import { R2_BUCKET_NAME, R2_PUBLIC_DOMAIN, r2Client } from "~~/server/utils/r2";

// Allowed avatar image MIME types — defined at module scope to avoid recreating on every request
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

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

    const avatarFile = body.find(
      (f) => f.name === "avatar" || f.name === "file"
    );
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
    const member = await MemberModel.findOne({ NIM: Number(NIM) });
    if (!member) {
      throw createError({
        statusCode: 404,
        statusMessage: "Member not found",
      });
    }

    // Process and save the new avatar
    if (!avatarFile?.type || !ALLOWED_IMAGE_TYPES.includes(avatarFile.type as any)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid file type: Please upload a JPEG, PNG, or WebP image",
      });
    }

    const fileObj = {
      name: avatarFile.filename || `${member.NIM}.${avatarFile.type.split("/")[1] || "png"}`,
      data: avatarFile.data,
      type: avatarFile.type
    };

    // --- UPLOAD KE R2 ---
    const imageUrl = await uploadToR2(fileObj, StoragePaths.AVATARS);

    // Update member dengan URL baru
    member.avatar = imageUrl;
    await member.save();
    // --------------------

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
