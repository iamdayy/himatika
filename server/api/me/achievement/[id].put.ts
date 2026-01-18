import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { PointModel } from "~~/server/models/PointModel";
import { IPointLog } from "~~/types";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const user = event.context.user;
    if (!user)
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const id = getRouterParam(event, "id");
    if (!id)
      throw createError({ statusCode: 400, statusMessage: "ID is required" });

    // Cek dulu apakah data ada dan milik user
    const existingAchievement = await PointModel.findOne({
      _id: id,
      member: user.member._id,
    });

    if (!existingAchievement) {
      throw createError({
        statusCode: 404,
        statusMessage: "Achievement not found",
      });
    }

    // Gunakan customReadMultipartFormData untuk handle upload (opsional)
    const body = await customReadMultipartFormData<IPointLog & { file: File }>(
      event,
      {
        allowedTypes: ["image/png", "image/jpeg", "image/webp"],
        compress: {
          quality: 75,
          maxWidth: 1000,
        },
      }
    );

    let proofUrl = existingAchievement.proof;

    // Jika ada file baru yang diupload
    if (body.file && typeof body.file !== "string") {
      const file = body.file;
      const BASE_PROOFS_FOLDER = `uploads/achievements/${user.member._id}/proofs`;
      const fileName = `${BASE_PROOFS_FOLDER}/${file.name}.${
        file.type?.split("/")[1] || "png"
      }`;

      // 1. Hapus file lama jika ada
      if (existingAchievement.proof) {
        const oldKey = existingAchievement.proof.replace(
          `${R2_PUBLIC_DOMAIN}/`,
          ""
        );
        try {
          await r2Client.send(
            new DeleteObjectCommand({
              Bucket: R2_BUCKET_NAME,
              Key: oldKey,
            })
          );
        } catch (err) {
          console.warn("Failed to delete old file:", err);
        }
      }

      // 2. Upload file baru
      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: fileName,
          Body: file.data,
          ContentType: file.type,
        })
      );
      proofUrl = `${R2_PUBLIC_DOMAIN}/${fileName}`;
    }

    // Update data di DB
    existingAchievement.reason = (body.reason as string) || existingAchievement.reason;
    existingAchievement.description = (body.description as string) || existingAchievement.description;
    existingAchievement.type = (body.type as "achievement" | "activity") || existingAchievement.type;
    existingAchievement.date = body.date ? new Date(body.date as string) : existingAchievement.date;
    existingAchievement.proof = proofUrl;
    existingAchievement.status = "pending"; // Reset status ke pending setiap kali diedit
    
    // Reset amount jika diperlukan, atau biarkan admin yang atur ulang
    // existingAchievement.amount = 0; 
    
    await existingAchievement.save();

    return {
      statusCode: 200,
      statusMessage: "Prestasi berhasil diperbarui dan menunggu validasi ulang.",
    };
  } catch (e: any) {
    console.error(e);
    throw createError({ statusCode: 500, statusMessage: e.message });
  }
});
