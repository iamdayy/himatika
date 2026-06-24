import { uploadToR2, StoragePaths } from "~~/server/utils/storage";
import { Types } from "mongoose";
import { AgendaModel } from "~~/server/models/AgendaModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { PhotoModel } from "~~/server/models/PhotoModel";
import { customReadMultipartFormData, ParsedFile } from "~~/server/utils/customReadMultipartFormData";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse & { data?: any }> => {
  try {
    const payload = await customReadMultipartFormData<any>(event, {
      allowedTypes: ["image/png", "image/jpeg", "image/webp"],
      compress: {
        quality: 75,
        maxWidth: 1000,
      },
      maxFileSize: 2 * 1024 * 1024,
    });

    const { id } = event.context.params as { id: string };
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusMessage: "Unauthorized",
      });
    }

    const agenda = await AgendaModel.findById(id);
    if (!agenda) {
      return {
        statusCode: 404,
        statusMessage: "Agenda not found",
      };
    }

    const isOrganizer = event.context.organizer;
    let isCommittee = false;
    if (!isOrganizer) {
      const { CommitteeModel } = await import("~~/server/models/CommitteeModel");
      const isRegisteredCommittee = await CommitteeModel.findOne({
        agendaId: agenda._id,
        member: user.member._id,
      });
      isCommittee = !!isRegisteredCommittee;
    }

    if (!isOrganizer && !isCommittee) {
      throw createError({
        statusMessage: "Unauthorized",
      });
    }

    let imagesData = payload.images;
    if (!imagesData) {
      throw createError({
        statusCode: 400,
        statusMessage: "No file uploaded",
      });
    }

    // Ensure it's an array
    const images: ParsedFile[] = Array.isArray(imagesData) ? imagesData : [imagesData];

    // Single DB lookup for uploader ID
    const uploaderId = (await getIdByNim(user.member.NIM)) as Types.ObjectId;
    if (!uploaderId) {
      throw createError({
        statusCode: 404,
        statusMessage: "Uploader member not found",
      });
    }

    // Process all uploads concurrently
    const uploadPromises = images.map(async (file: ParsedFile, index: number) => {
      if (typeof file === "string" || !file.type?.startsWith("image/")) {
         return null; // Skip invalid
      }
      
      const imageUrl = await uploadToR2(file, StoragePaths.AGENDAS(agenda._id.toString(), 'photos'));
      
      // Look for tags mapped to this index
      const tagField = `tags_${index}`;
      const tagStr = payload[tagField];
      let tags: string[] = [];
      if (tagStr && typeof tagStr === 'string') {
        try {
           tags = JSON.parse(tagStr);
        } catch(e) {}
      } else if (Array.isArray(tagStr)) {
         // Fallback if somehow array
         tags = tagStr.map(String);
      }

      return PhotoModel.create({
        on: agenda._id,
        onModel: "Agenda",
        tags,
        image: imageUrl,
        uploader: uploaderId,
      });
    });

    const savedPhotos = (await Promise.all(uploadPromises)).filter(Boolean);

    return {
      statusCode: 200,
      statusMessage: "Photos added successfully",
      data: savedPhotos // Return the saved photos directly
    };
  } catch (error: any) {
    console.error(error);
    return {
      statusCode: 500,
      statusMessage: "Internal Server Error",
    };
  }
});

/**
 * Retrieves the user's ID by their NIM (Nomor Induk Mahasiswa).
 */
const getIdByNim = async (NIM: number): Promise<Types.ObjectId | undefined> => {
  try {
    const member = await MemberModel.findOne({ NIM });
    return member?._id as Types.ObjectId;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve user ID by NIM",
    });
  }
};
