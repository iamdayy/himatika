import { deleteFromR2 } from "~~/server/utils/storage";
import { PointModel } from "~~/server/models/PointModel";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const user = event.context.user;
    if (!user?.member)
      throw createError({
        statusCode: 403,
        statusMessage: "Hanya member yang dapat menghapus klaim poin",
      });

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

    // Same immutability rule as PUT: organizer-processed logs are audit
    // records and cannot be removed by the member.
    if (achievement.status !== "pending") {
      throw createError({
        statusCode: 403,
        statusMessage:
          "Poin yang sudah diproses organizer tidak dapat dihapus. Hubungi organizer untuk koreksi.",
      });
    }

    // Hapus file dari R2 jika ada
    if (achievement.proof) {
      try {
        await deleteFromR2(achievement.proof);
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
    throw createError({
      statusCode: e.statusCode || 500,
      statusMessage: e.statusMessage || e.message || "Terjadi Kesalahan Server",
    });
  }
});
