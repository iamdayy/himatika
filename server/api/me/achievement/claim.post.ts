import { put } from "@vercel/blob";
import { PointModel } from "~~/server/models/PointModel";
import { IPointLog } from "~~/types";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const user = event.context.user;
    if (!user)
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const body = await customReadMultipartFormData<IPointLog & { file: File }>(
      event
    );

    const BASE_PROOFS_FOLDER = `/uploads/achievements/${user.member._id}/proofs`;
    let proofUrl = "";

    const file = body.file as any;
    if (file) {
      const fileName = `${BASE_PROOFS_FOLDER}/${Date.now().toString()}.${
        file.type?.split("/")[1] || "png"
      }`;

      const { url } = await put(fileName, file.data, {
        access: "public",
      });
      proofUrl = url;
    }

    await PointModel.create({
      member: user.member._id,
      reason: body.reason, // Contoh: Juara 2 Fotografi
      description: body.description,
      type: body.type, // achievement / activity
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
    throw createError({ statusCode: 500, statusMessage: e.message });
  }
});
