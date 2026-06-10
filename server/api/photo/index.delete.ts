import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { PhotoModel } from "~~/server/models/PhotoModel";
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
        statusMessage: "ID foto tidak disertakan",
      });
    }
    const photo = await PhotoModel.findByIdAndDelete(id);
    if (!photo) {
      throw createError({
        statusCode: 404,
        statusMessage: "Foto tidak ditemukan",
      });
    }
    // Delete the associated main image file if it exists
    if (photo.image) {
      const mainImageKey = (photo.image as string).split("/").pop();
      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: mainImageKey,
        })
      );
    }
    return { statusCode: 200, statusMessage: "Foto berhasil dihapus" };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Terjadi Kesalahan Server",
    };
  }
});
