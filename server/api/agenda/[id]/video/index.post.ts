import { Types } from "mongoose";
import { AgendaModel } from "~~/server/models/AgendaModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { VideoModel } from "~~/server/models/VideoModel";
import { R2_PUBLIC_DOMAIN } from "~~/server/utils/r2";
import { StoragePaths, uploadToR2 } from "~~/server/utils/storage";
import { IVideo } from "~~/types";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const { id } = event.context.params as { id: string };
    const user = event.context.user;
    if (!user) {
      throw createError({ statusMessage: "Unauthorized" });
    }

    const agenda = await AgendaModel.findById(id);
    if (!agenda) {
      return { statusCode: 404, statusMessage: "Agenda not found" };
    }

    // Authorization: organizer or committee
    const isOrganizer = event.context.organizer;
    let isCommittee = false;
    if (!isOrganizer) {
      const { CommitteeModel } = await import("~~/server/models/CommitteeModel");
      const isRegisteredCommittee = await CommitteeModel.findOne({
        agendaId: agenda._id,
        member: user.member._id,
      });
      isCommittee = !!isRegisteredCommittee;
    }
    if (!isOrganizer && !isCommittee) {
      throw createError({ statusMessage: "Unauthorized" });
    }

    const uploaderId = (await getIdByNim(user.member.NIM)) as Types.ObjectId;

    // Check content-type to determine flow
    const contentType = getHeader(event, "content-type") || "";

    if (contentType.includes("application/json")) {
      // === PRESIGNED URL MODE ===
      // Video has already been uploaded directly to R2 by the frontend
      const body = await readBody(event);
      const { fileKey, tags } = body as { fileKey: string; tags: string[] };

      if (!fileKey) {
        throw createError({ statusCode: 400, statusMessage: "fileKey is required" });
      }

      // Construct the public URL for the raw video
      const cleanDomain = R2_PUBLIC_DOMAIN.replace(/\/$/, "");
      const rawVideoUrl = `${cleanDomain}/${fileKey}`;

      // Create video record with 'processing' status
      const saved = await VideoModel.create({
        on: agenda._id,
        onModel: "Agenda",
        tags: tags || [],
        video: rawVideoUrl,
        uploader: uploaderId,
        processingStatus: "processing",
        rawFileKey: fileKey,
      });

      if (!saved) {
        throw createError({ statusCode: 500, statusMessage: "Failed to save video" });
      }

      // Trigger Media Worker asynchronously (fire-and-forget)
      const config = useRuntimeConfig();
      if (config.pdf_worker_api_url) {
        const callbackUrl = `${config.public.public_uri}/api/storage/webhook-media`;
        $fetch(`${config.pdf_worker_api_url}/media/compress-video`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: {
            fileKey,
            videoId: saved._id.toString(),
            callbackUrl,
          },
        }).catch((err) => {
          console.error("Failed to trigger media worker:", err);
          // Mark as failed if worker is unreachable
          VideoModel.findByIdAndUpdate(saved._id, {
            processingStatus: "failed",
          }).catch(console.error);
        });
      }

      return {
        statusCode: 200,
        statusMessage: "Video uploaded, processing started",
        data: { videoId: saved._id.toString(), processingStatus: "processing" },
      } as any;
    } else {
      // === LEGACY FORMDATA MODE (for small files < 20MB) ===
      const video = await customReadMultipartFormData<IVideo>(event, {
        allowedTypes: ["video/mp4", "video/webm"],
        maxFileSize: 20 * 1024 * 1024, // 20MB
      });

      let videoUrl = "";
      const file = video.video;
      if (!file) {
        throw createError({ statusCode: 400, statusMessage: "No file uploaded" });
      }
      if (typeof file === "string") {
        throw createError({ statusCode: 400, statusMessage: "Invalid file data" });
      }

      if (file.type?.startsWith("video/")) {
        videoUrl = await uploadToR2(file, StoragePaths.AGENDAS(agenda._id.toString(), "videos"));
      } else {
        throw createError({ statusMessage: "Please upload nothing but videos." });
      }

      const saved = await VideoModel.create({
        on: agenda._id,
        onModel: "Agenda",
        tags: video.tags ? JSON.parse(video.tags as string) : [],
        video: videoUrl,
        uploader: uploaderId,
        processingStatus: "completed",
      });

      if (!saved) {
        throw createError({ statusCode: 500, statusMessage: "Failed to save video" });
      }

      return { statusCode: 200, statusMessage: "Video added successfully" };
    }
  } catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string };
    console.error(err);
    return {
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || "Internal Server Error",
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
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || "Failed to retrieve user ID by NIM",
    });
  }
};

