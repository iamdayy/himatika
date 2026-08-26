import { PointModel } from "~~/server/models/PointModel";
import { StoragePaths, uploadToR2 } from "~~/server/utils/storage";
import { IPointLog } from "~~/types";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const user = event.context.user;
    if (!user?.member)
      throw createError({
        statusCode: 403,
        statusMessage: "Hanya member yang dapat mengklaim poin prestasi",
      });

    // Anti-spam: batasi klaim pending yang mengantre per member.
    const openClaims = await PointModel.countDocuments({
      member: user.member._id,
      status: "pending",
    });
    if (openClaims >= 10) {
      throw createError({
        statusCode: 429,
        statusMessage:
          "Anda masih memiliki 10 klaim menunggu validasi. Tunggu proses organizer sebelum mengklaim lagi.",
      });
    }

    const body = await customReadMultipartFormData<IPointLog & { file: File }>(
      event,
      {
        allowedTypes: ["image/png", "image/jpeg", "image/webp"],
        compress: {
          quality: 75, // Turunkan kualitas ke 75% (cukup bagus untuk web)
          maxWidth: 1000, // Resize lebar maksimal jadi 1000px
        },
      }
    );

    let proofUrl = "";

    const file = body.file;
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
    
    if (file) {
      proofUrl = await uploadToR2(file, StoragePaths.ACHIEVEMENTS(user.member.NIM));
    }

    await PointModel.create({
      member: user.member._id,
      reason: body.reason as string, // Contoh: Juara 2 Fotografi
      description: body.description as string,
      type: body.type as "achievement" | "activity", // achievement / activity
      proof: proofUrl, // Link gambar/PDF yang sudah diupload
      amount: 0, // Poin 0 dulu, nanti Admin yang tentukan bobotnya
      status: "pending", // Default pending
      date: body.date ? new Date(body.date as string) : new Date(),
    });

    return {
      statusCode: 200,
      statusMessage: "Klaim prestasi berhasil dikirim. Tunggu validasi admin.",
    };
  } catch (e: any) {
    console.error(e);
    // Preserve intentional HTTP statuses (400/403/429) — previously every
    // failure surfaced as a generic 500.
    throw createError({
      statusCode: e.statusCode || 500,
      statusMessage: e.statusMessage || e.message || "Terjadi Kesalahan Server",
      data: e.data,
    });
  }
});
