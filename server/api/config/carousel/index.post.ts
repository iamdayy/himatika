import { PutObjectCommand } from "@aws-sdk/client-s3";
import { Types } from "mongoose";
import { MemberModel } from "~~/server/models/MemberModel";
import { PhotoModel } from "~~/server/models/PhotoModel";
import { IPhoto } from "~~/types";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IResponse & { data?: IPhoto }> => {
    try {
      const photo = await customReadMultipartFormData<IPhoto>(event, {
        allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
        compress: {
          quality: 75, // Turunkan kualitas ke 75% (cukup bagus untuk web)
        },
        maxFileSize: 2 * 1024 * 1024, // 2MB
      });

      const user = event.context.user;
      if (!user) {
        throw createError({
          statusCode: 401,
          statusMessage: "Unauthorized",
        });
      }
      const organizer = event.context.organizer;
      if (!organizer) {
        throw createError({
          statusCode: 401,
          statusMessage: "You are not authorized to perform this action",
        });
      }
      const BASE_PHOTO_FOLDER = "/uploads/img/carousel/photos";
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

      const fileName = `${BASE_PHOTO_FOLDER}/${file.name}.${
        file.type?.split("/")[1]
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
          statusCode: 400,
          statusMessage: "Please upload nothing but images.",
        });
      }
      const saved = await PhotoModel.create({
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
    } catch (error: any) {
      // console.log(error);
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || "Failed to add photo",
      });
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
