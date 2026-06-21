import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_BUCKET_NAME } from "~~/server/utils/r2";
import { StoragePaths } from "~~/server/utils/storage";
import { AgendaModel } from "~~/server/models/AgendaModel";
import { z } from "zod/v4";
import type { IResponse } from "~~/types/IResponse";

const bodySchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().regex(/^video\//),
  agendaId: z.string().min(1),
  fileSize: z.number().max(100 * 1024 * 1024), // 100MB max
});

interface IPresignedUrlResponse extends IResponse {
  data?: {
    uploadUrl: string;
    fileKey: string;
  };
}

export default defineEventHandler(async (event): Promise<IPresignedUrlResponse> => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const body = await readBody(event);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw createError({
        statusCode: 400,
        statusMessage: `Validation error: ${parsed.error.issues.map(i => i.message).join(", ")}`,
      });
    }

    const { fileName, contentType, agendaId, fileSize } = parsed.data;

    // Verify agenda exists
    const agenda = await AgendaModel.findById(agendaId);
    if (!agenda) {
      throw createError({ statusCode: 404, statusMessage: "Agenda not found" });
    }

    // Verify user is organizer or committee of this agenda
    const isOrganizer = event.context.organizer;
    let isCommittee = false;
    if (!isOrganizer) {
      const { CommitteeModel } = await import("~~/server/models/CommitteeModel");
      const committeeRecord = await CommitteeModel.findOne({
        agendaId: agenda._id,
        member: user.member._id,
      });
      isCommittee = !!committeeRecord;
    }

    if (!isOrganizer && !isCommittee) {
      throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    }

    // Generate a unique key
    const safeFileName = (fileName || "upload").replace(/[^a-zA-Z0-9.-]/g, "_");
    const timestamp = Date.now();
    const folderPath = StoragePaths.AGENDAS(agenda._id.toString(), "videos");
    const fileKey = `${folderPath}/raw_${timestamp}_${safeFileName}`;

    // Create presigned PUT URL (expires in 15 minutes)
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 });

    return {
      statusCode: 200,
      statusMessage: "Presigned URL generated",
      data: {
        uploadUrl,
        fileKey,
      },
    };
  } catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string };
    console.error("Presigned URL error:", error);
    return {
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || "Internal Server Error",
    };
  }
});
