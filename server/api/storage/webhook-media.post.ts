import { z } from "zod/v4";
import { VideoModel } from "~~/server/models/VideoModel";
import type { IResponse } from "~~/types/IResponse";

const bodySchema = z.object({
  videoId: z.string().min(1),
  status: z.enum(["completed", "failed"]),
  processedUrl: z.string().optional(),
});

/**
 * Webhook endpoint called by Media Worker after video compression.
 */
export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const config = useRuntimeConfig();

    const body = await readBody(event);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw createError({
        statusCode: 400,
        statusMessage: `Validation error: ${parsed.error.issues.map(i => i.message).join(", ")}`,
      });
    }

    const { videoId, status, processedUrl } = parsed.data;

    const video = await VideoModel.findById(videoId);
    if (!video) {
      throw createError({ statusCode: 404, statusMessage: "Video not found" });
    }

    if (status === "completed" && processedUrl) {
      // Update with the compressed video URL and clear rawFileKey
      video.video = processedUrl;
      video.processingStatus = "completed";
      video.rawFileKey = undefined;
    } else {
      // Mark as failed but keep rawFileKey for potential retry
      video.processingStatus = "failed";
    }

    await video.save();

    return {
      statusCode: 200,
      statusMessage: `Video processing ${status}`,
    };
  } catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string };
    console.error("Webhook media error:", error);
    return {
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || "Internal Server Error",
    };
  }
});
