import CategoryModel from "~~/server/models/CategoryModel";
import { NewsModel } from "~~/server/models/NewsModel";
import { PointModel } from "~~/server/models/PointModel";
import { IMember } from "~~/types";
import { IResponse } from "~~/types/IResponse";

const createSlug = (text: string) => {
  return (
    text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-") +
    "-" +
    Date.now().toString().slice(-4)
  );
};

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const user = event.context.user;
    if (!user || !user.member.organizer) {
      throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    }

    // Terima data tambahan: createNews, newsTitle, newsBody
    const body = await readBody<{
      id: string;
      action: "approve" | "reject";
      amount?: number;
      createNews?: boolean;
      newsTitle?: string;
      newsBody?: string;
    }>(event);

    const record = await PointModel.findById(body.id).populate("member");
    if (!record)
      throw createError({
        statusCode: 404,
        statusMessage: "Data tidak ditemukan",
      });

    if (body.action === "reject") {
      record.status = "rejected";
    } else {
      record.status = "approved";
      record.amount = body.amount || 0;
      record.admin = user._id;

      // 1. Buat Berita (Hanya jika createNews === true)
      if (body.createNews) {
        try {
          let category = await CategoryModel.findOne({ title: "Prestasi" });
          if (!category) {
            category = await CategoryModel.create({
              title: "Prestasi",
              description: "Prestasi Anggota",
              slug: "prestasi",
            });
          }

          // Gunakan judul & body dari Input Admin, atau fallback ke default
          const finalTitle = body.newsTitle || `Prestasi: ${record.reason}`;
          const finalBody =
            body.newsBody || record.description || "Tidak ada deskripsi.";

          await NewsModel.create({
            title: finalTitle,
            slug: createSlug(finalTitle),
            mainImage: record.proof || "/img/placeholder-banner.png",
            body: finalBody,
            category: category._id,
            authors: [(record.member as IMember).id], // Author tetap member ybs
            tags: ["Prestasi", "Achievement"],
            published: true,
            publishedAt: new Date(),
          });
        } catch (newsError) {
          console.error("Gagal publish berita:", newsError);
          // Approval tetap sukses walau berita gagal
        }
      }
    }

    await record.save();

    return {
      statusCode: 200,
      statusMessage:
        body.action === "approve"
          ? "Data berhasil disetujui."
          : "Data ditolak.",
    };
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e.message });
  }
});
