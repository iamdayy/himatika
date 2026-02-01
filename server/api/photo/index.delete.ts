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
        statusMessage: "You must be logged in to use this endpoint",
      });
    }
    if (!event.context.organizer) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be admin / departement to use this endpoint",
      });
    }
    const { id } = getQuery(event);
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "No photo id provided",
      });
    }
    const photo = await PhotoModel.findById(id);
    // Delete the associated main image file if it exists
    if (photo && photo.image) {
      const mainImageKey = (photo.image as string).split("/").pop(); //Get only file name without domain;
            await r2Client.send(
              new DeleteObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: mainImageKey,
              })
            );
    }
    if (!photo) {
      throw createError({
        statusCode: 404,
        statusMessage: "Photo not found",
      });
    }
    await PhotoModel.findByIdAndDelete(id);
    return { statusCode: 200, statusMessage: "Photo deleted" };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Internal Server Error",
    };
  }
});
