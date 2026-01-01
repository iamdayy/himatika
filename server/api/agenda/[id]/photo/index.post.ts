import { PutObjectCommand } from "@aws-sdk/client-s3";
import { Types } from "mongoose";
import { AgendaModel } from "~~/server/models/AgendaModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { PhotoModel } from "~~/server/models/PhotoModel";
import { customReadMultipartFormData } from "~~/server/utils/customReadMultipartFormData";
import { IMember, IPhoto } from "~~/types";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const photo = await customReadMultipartFormData<IPhoto>(event);

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
    if (
      !agenda.committees
        ?.map((committee) => (committee.member as IMember).NIM)
        .includes(user.member.NIM)
    ) {
      throw createError({
        statusMessage: "Unauthorized",
      });
    }
    const BASE_PHOTO_FOLDER = `/uploads/img/agenda/${agenda._id}/photos`;
    let imageUrl = "";
    const file = photo.image;
    if (!file) {
      throw createError({
        statusCode: 400,
        statusMessage: "No file uploaded",
      });
    }
    if (typeof file === "string") {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid file data",
      });
    }

    const fileName = `${BASE_PHOTO_FOLDER}/${hashText(`${agenda._id}`)}.${
      file.type?.split("/")[1] || "png"
    }`;

    // Handle main image upload
    if (file.type?.startsWith("image/")) {
      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: fileName,
          Body: file.data,
          ContentType: file.type,
        })
      );

      imageUrl = `${R2_PUBLIC_DOMAIN}/${fileName}`;
    } else {
      throw createError({
        statusMessage: "Please upload nothing but images.",
      });
    }
    const saved = await PhotoModel.create({
      on: agenda._id,
      onModel: "Agenda",
      tags: photo.tags ? photo.tags : [],
      image: imageUrl,
      uploader: (await getIdByNim(user.member.NIM)) as Types.ObjectId,
    });
    if (!saved) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to save photo",
      });
    }
    return {
      statusCode: 200,
      statusMessage: "Photo added successfully",
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
 * @param {number} NIM - The user's NIM.
 * @returns {Promise<Types.ObjectId | undefined>} The user's ID or undefined if not found.
 * @throws {H3Error} If an error occurs during the database query.
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
