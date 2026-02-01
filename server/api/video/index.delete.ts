import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { VideoModel } from "~~/server/models/VideoModel";
import { IResponse } from "~~/types/IResponse";
const config = useRuntimeConfig();
export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 403,
        statusMessage: "Anda harus login untuk menggunakan endpoint ini",
      });
    }
    if (!event.context.organizer) {
      throw createError({
        statusCode: 403,
        statusMessage: "Anda harus menjadi admin / departemen untuk menggunakan endpoint ini",
      });
    }
    const { id } = getQuery(event);
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID video tidak disertakan",
      });
    }
    const video = await VideoModel.findById(id);
    // Delete the associated main video file if it exists
    if (video && video.video) {
      const mainImageKey = (video.video as string).split("/").pop(); //Get only file name without domain;
      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: mainImageKey,
        })
      );
    }
    if (!video) {
      throw createError({
        statusCode: 404,
        statusMessage: "Video tidak ditemukan",
      });
    }
    await VideoModel.findByIdAndDelete(id);
    return { statusCode: 200, statusMessage: "Video berhasil dihapus" };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Terjadi Kesalahan Server",
    };
  }
});
