import { del } from "@vercel/blob";
import { VideoModel } from "~~/server/models/VideoModel";
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
        statusMessage: "No video id provided",
      });
    }
    const video = await VideoModel.findById(id);
    // Delete the associated main video file if it exists
    if (video && video.video) {
      await del(video.video as string);
    }
    if (!video) {
      throw createError({
        statusCode: 404,
        statusMessage: "Video not found",
      });
    }
    await VideoModel.findByIdAndDelete(id);
    return { statusCode: 200, statusMessage: "Video deleted" };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Internal Server Error",
    };
  }
});
