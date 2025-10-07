import { put } from "@vercel/blob";
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
    console.log(photo);

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
    const image = photo.image as File;

    console.log(`Type: ${image.type}`);

    const fileName = `${BASE_PHOTO_FOLDER}/${hashText(`${agenda._id}`)}.${
      image.type?.split("/")[1] || "png"
    }`;

    // Handle main image upload
    const { url } = await put(fileName, image, {
      access: "public",
    });

    imageUrl = url;
    // if (image.type?.startsWith("image/")) {
    //   // const hashedName = await storeFileLocally(image, 12, BASE_PHOTO_FOLDER);
    // } else {
    //   throw createError({
    //     statusMessage: "Please upload nothing but images.",
    //   });
    // }
    const saved = await PhotoModel.create({
      on: agenda._id,
      onModel: "Agenda",
      tags: photo.tags ? JSON.parse(photo.tags) : [],
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
