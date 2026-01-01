import { PutObjectCommand } from "@aws-sdk/client-s3";
import { Types } from "mongoose";
import { AgendaModel } from "~~/server/models/AgendaModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { VideoModel } from "~~/server/models/VideoModel";
import { IMember, IVideo } from "~~/types";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const video = await customReadMultipartFormData<IVideo>(event);

    const { id } = event.context.params as { id: string };
    const user = event.context.user;
    const organizer = event.context.organizer;
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
    const BASE_VIDEO_FOLDER = `/uploads/img/agenda/${agenda._id}/videos`;
    let videoUrl = "";
    const file = video.video;
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
    const fileName = `${BASE_VIDEO_FOLDER}/${hashText(`${agenda._id}`)}.${
      file.type?.split("/")[1] || "mp4"
    }`;

    // Handle main video upload
    if (file.type?.startsWith("video/")) {
      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: fileName,
          Body: file.data,
          ContentType: file.type,
        })
      );
      videoUrl = `${R2_PUBLIC_DOMAIN}/${fileName}`;
    } else {
      throw createError({
        statusMessage: "Please upload nothing but videos.",
      });
    }
    const saved = await VideoModel.create({
      on: agenda._id,
      onModel: "Agenda",
      tags: video.tags ? video.tags : [],
      video: videoUrl,
      uploader: (await getIdByNim(user.member.NIM)) as Types.ObjectId,
    });
    if (!saved) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to save video",
      });
    }
    return {
      statusCode: 200,
      statusMessage: "Video added successfully",
    };
  } catch (error: any) {
    console.error(error);
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
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
