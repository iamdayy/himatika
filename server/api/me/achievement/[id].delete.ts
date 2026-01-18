import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { PointModel } from "~~/server/models/PointModel";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const user = event.context.user;
    if (!user)
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const id = getRouterParam(event, "id");
    if (!id)
      throw createError({ statusCode: 400, statusMessage: "ID is required" });

    const achievement = await PointModel.findOne({
      _id: id,
      member: user.member._id,
    });

    if (!achievement) {
      throw createError({
        statusCode: 404,
        statusMessage: "Achievement not found",
      });
    }

    // Hapus file dari R2 jika ada
    if (achievement.proof) {
      // proof url: https://pub-xxx.../uploads/achievements/...
      // kita perlu ambil key-nya saja: uploads/achievements/...
      const proofUrl = achievement.proof;
      const key = proofUrl.replace(`${R2_PUBLIC_DOMAIN}/`, "");

      try {
        await r2Client.send(
          new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
          })
        );
      } catch (err) {
        console.error("Failed to delete file from R2:", err);
        // Lanjut saja hapus data di DB meskipun file gagal dihapus (soft fail)
      }
    }

    await achievement.deleteOne();

    return {
      statusCode: 200,
      statusMessage: "Prestasi berhasil dihapus",
    };
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e.message });
  }
});
