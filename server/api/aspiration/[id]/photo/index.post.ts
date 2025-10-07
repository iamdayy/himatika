import { put } from "@vercel/blob";
import { Types } from "mongoose";
import { AspirationModel } from "~~/server/models/AspirationModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { PhotoModel } from "~~/server/models/PhotoModel";
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
    const aspiration = await AspirationModel.findById(id);
    if (!aspiration) {
      return {
        statusCode: 404,
        statusMessage: "Aspiration not found",
      };
    }

    if ((aspiration.from as IMember).NIM !== user.member.NIM) {
      throw createError({
        statusMessage: "Unauthorized",
      });
    }
    const BASE_PHOTO_FOLDER = `/uploads/img/aspiration/${aspiration._id}/photos`;
    let imageUrl = "";
    const image = photo.image as File;
    const fileName = `${BASE_PHOTO_FOLDER}/${hashText(image.name)}.${
      image.type.split("/")[1]
    }`;
    // Handle main image upload
    if (image.type?.startsWith("image/")) {
      const { url } = await put(fileName, image, { access: "public" });
      imageUrl = url;
    } else {
      throw createError({
        statusMessage: "Please upload nothing but images.",
      });
    }
    const saved = await PhotoModel.create({
      on: aspiration._id,
      onModel: "Aspiration",
      tags: photo.tags,
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
      statusMessage: error.statusMessage || "Failed to add photo",
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
