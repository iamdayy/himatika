import { Types } from "mongoose";
import { MemberModel } from "~~/server/models/MemberModel";
import { PhotoModel } from "~~/server/models/PhotoModel";
import { IFile, IPhoto } from "~~/types";
import { IReqAgendaPhoto } from "~~/types/IRequestPost";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IResponse & { data?: IPhoto }> => {
    try {
      const { photo } = await readBody<IReqAgendaPhoto>(event);

      const user = event.context.user;
      const organizer = event.context.organizer;
      if (!user) {
        throw createError({
          statusMessage: "Unauthorized",
        });
      }
      if (!organizer) {
        throw createError({
          statusMessage: "Unauthorized",
        });
      }
      const BASE_PHOTO_FOLDER = "/uploads/img/carousel/photos";
      let imageUrl = "";
      const image = photo.image as IFile;

      // Handle main image upload
      if (image.type?.startsWith("image/")) {
        const hashedName = await storeFileLocally(image, 12, BASE_PHOTO_FOLDER);
        imageUrl = `${BASE_PHOTO_FOLDER}/${hashedName}`;
      } else {
        throw createError({
          statusMessage: "Please upload nothing but images.",
        });
      }
      const saved = await PhotoModel.create({
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
        data: saved as IPhoto,
      };
    } catch (error) {
      return {
        statusCode: 500,
        statusMessage: "Internal Server Error",
      };
    }
  }
);

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
