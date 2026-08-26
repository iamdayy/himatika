import mongoose from "mongoose";
import { z } from "zod";
import { PointModel } from "~~/server/models/PointModel";
import { NewsModel } from "~~/server/models/NewsModel";
import { CategoryModel } from "~~/server/models/CategoryModel";
import { AuditLogModel } from "~~/server/models/AuditLogModel";
import { ensureOrganizer } from "~~/server/utils/agendaAuth";
import { IResponse } from "~~/types/IResponse";

const decideSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID tidak valid"),
  action: z.enum(["approve", "reject"]),
  // Bobot poin: bilangan bulat non-negatif dalam batas wajar.
  amount: z.coerce.number().int().min(0).max(255).optional(),
  createNews: z.boolean().optional(),
  newsTitle: z.string().max(200).optional(),
  newsBody: z.string().max(5000).optional(),
});

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    await ensureOrganizer(event.context.user);

    const parsed = decideSchema.safeParse(await readBody(event));
    if (!parsed.success) {
      throw createError({
        statusCode: 400,
        statusMessage:
          parsed.error.issues[0]?.message || "Payload keputusan tidak valid",
        data: parsed.error.format(),
      });
    }
    const body = parsed.data;

    // State machine: hanya klaim PENDING yang boleh diputuskan. Tanpa ini,
    // approved bisa di-approve ulang (duplikat berita prestasi) dan rejected
    // bisa "dihidupkan" kembali secara diam-diam.
    // Admin id may be missing on legacy tokens — only stamp it when valid.
    const adminIdRaw =
      event.context.user.member?._id ?? event.context.user._id;
    const adminSet = mongoose.isValidObjectId(adminIdRaw)
      ? { admin: new mongoose.Types.ObjectId(String(adminIdRaw)) }
      : {};

    const record = await PointModel.findOneAndUpdate(
      { _id: body.id, status: "pending" },
      body.action === "reject"
        ? { $set: { status: "rejected" } }
        : {
            $set: {
              status: "approved",
              amount: body.amount ?? 0,
              ...adminSet,
            },
          },
      { new: true }
    ).populate("member", "fullName NIM email");

    if (!record) {
      throw createError({
        statusCode: 409,
        statusMessage:
          "Klaim ini sudah diproses sebelumnya atau tidak ditemukan.",
      });
    }

    // Berita prestasi — hanya pada transisi pending → approve.
    if (body.action === "approve" && body.createNews && record.amount > 0) {
      try {
        let category = await CategoryModel.findOne({ title: "Prestasi" });
        if (!category) {
          category = await CategoryModel.create({
            title: "Prestasi",
            description: "Berita prestasi mahasiswa",
            slug: "prestasi",
          });
        }
        const member = record.member as any;
        await NewsModel.create({
          title: body.newsTitle || `Prestasi: ${member?.fullName || "Mahasiswa"}`,
          body: body.newsBody || "",
          category: category._id,
          slug: `${Date.now()}-prestasi-${member?.NIM ?? "member"}`,
          mainImage: member?.avatar || "",
          authors: [],
          tags: ["prestasi"],
          published: true,
        });
      } catch (newsErr: any) {
        // Kegagalan berita tidak boleh menggagalkan keputusan poin.
        console.error("[decide] Failed to create achievement news:", newsErr?.message);
      }
    }

    // Audit trail
    try {
      const ip = getRequestIP(event, { xForwardedFor: true }) || "unknown";
      await AuditLogModel.create({
        action: body.action === "approve" ? "POINT_APPROVE" : "POINT_REJECT",
        user: (record.member as any)?._id ?? record.member,
        ip,
        details: {
          pointLogId: String(record._id),
          amount: record.amount,
          reason: record.reason,
          byOrganizer: event.context.user.member?.NIM,
        },
        target: "Points",
      });
    } catch (logErr) {
      console.error("[decide] Audit log failed:", logErr);
    }

    return {
      statusCode: 200,
      statusMessage:
        body.action === "approve"
          ? `Klaim disetujui dengan ${record.amount} poin`
          : "Klaim ditolak",
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || "Terjadi Kesalahan Server",
      data: error.data,
    });
  }
});
