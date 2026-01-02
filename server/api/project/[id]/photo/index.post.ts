import { PutObjectCommand } from "@aws-sdk/client-s3";
import { Types } from "mongoose";
import { MemberModel } from "~~/server/models/MemberModel";
import { PhotoModel } from "~~/server/models/PhotoModel";
import { ProjectModel } from "~~/server/models/ProjectModel";
import { IMember, IPhoto } from "~~/types";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const photo = await customReadMultipartFormData<IPhoto>(event, {
      allowedTypes: ["image/png", "image/jpeg", "image/webp"],
      compress: {
        quality: 75, // Turunkan kualitas ke 75
        maxWidth: 1000, // Resize lebar maksimal jadi 1000px
      },
      maxFileSize: 2 * 1024 * 1024, // 2MB
    });

    const { id } = event.context.params as { id: string };
    const user = event.context.user;
    const organizer = event.context.organizer;
    if (!user) {
      throw createError({
        statusMessage: "Unauthorized",
      });
    }
    const project = await ProjectModel.findById(id);
    if (!project) {
      return {
        statusCode: 404,
        statusMessage: "Project not found",
      };
    }
    if (
      project.members
        .map((member) => (member as IMember).NIM)
        .includes(user.member.NIM)
    ) {
      throw createError({
        statusMessage: "You are not authorized to add photos to this project",
      });
    }
    const BASE_PHOTO_FOLDER = "/uploads/img/project/photos";
    let imageUrl = "";
    const file = photo.image;
    if (!file) {
      throw createError({
        statusMessage: "No file uploaded",
      });
    }

    if (typeof file === "string") {
      throw createError({
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
        statusMessage: "Please upload nothing but images.",
      });
    }
    const saved = await PhotoModel.create({
      on: project._id,
      onModel: "Project",
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
  } catch (error) {
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
