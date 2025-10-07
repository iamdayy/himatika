import { put } from "@vercel/blob";
import { Types } from "mongoose";
import { AspirationModel } from "~~/server/models/AspirationModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { VideoModel } from "~~/server/models/VideoModel";
import { IMember, IVideo } from "~~/types";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const video = await customReadMultipartFormData<IVideo>(event);

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
    const BASE_VIDEO_FOLDER = `/uploads/img/aspiration/${aspiration._id}/videos`;
    let videoUrl = "";
    const vid = video.video as File;

    const fileName = `${BASE_VIDEO_FOLDER}/${hashText(vid.name)}.${
      vid.type.split("/")[1]
    }`;
    // Handle main video upload
    if (vid.type?.startsWith("video/")) {
      const { url } = await put(fileName, vid, { access: "public" });
      videoUrl = url;
    } else {
      throw createError({
        statusMessage: "Please upload nothing but videos.",
      });
    }
    const saved = await VideoModel.create({
      on: aspiration._id,
      onModel: "Aspiration",
      tags: video.tags,
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
    console.log(error);
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
