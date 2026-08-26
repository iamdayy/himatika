import { z } from "zod";
import { PointModel } from "~~/server/models/PointModel";
import { ensureOrganizer, resolveMemberId } from "~~/server/utils/agendaAuth";
import { IResponse } from "~~/types/IResponse";

const addPointSchema = z.object({
  memberId: z.string().regex(/^[0-9a-fA-F]{24}$/, "memberId tidak valid"),
  amount: z.coerce.number().int("Poin harus bilangan bulat").min(1, "Poin minimal 1").max(255, "Poin maksimal 255"),
  reason: z.string().trim().min(1, "Alasan diperlukan").max(200),
  type: z.enum(["achievement", "activity"]).default("activity"),
  date: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
});

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    // Organizer-only (DB-backed: mencakup seluruh bentuk jabatan staff).
    await ensureOrganizer(event.context.user);

    const parsed = addPointSchema.safeParse(await readBody(event));
    if (!parsed.success) {
      throw createError({
        statusCode: 400,
        statusMessage:
          parsed.error.issues[0]?.message || "Data poin tidak valid",
        data: parsed.error.format(),
      });
    }
    const body = parsed.data;

    // Self-award blocked.
    const organizerMemberId = await resolveMemberId(event.context.user);
    if (organizerMemberId && organizerMemberId === body.memberId) {
      throw createError({
        statusCode: 403,
        statusMessage: "Anda tidak dapat memberikan poin ke akun Anda sendiri",
      });
    }

    // Target member must exist (previously CastError/garbage ids created
    // orphan point rows pointing at nothing).
    const { MemberModel } = await import("~~/server/models/MemberModel");
    const memberExists = await MemberModel.exists({ _id: body.memberId });
    if (!memberExists) {
      throw createError({
        statusCode: 404,
        statusMessage: "Member tujuan tidak ditemukan",
      });
    }

    await PointModel.create({
      member: body.memberId,
      admin: organizerMemberId,
      amount: body.amount,
      reason: body.reason,
      type: body.type,
      status: "approved", // manual award langsung sah — eksplisit, bukan default skema
      date: body.date ? new Date(body.date) : new Date(),
    });

    return {
      statusCode: 200,
      statusMessage: "Poin berhasil ditambahkan ke riwayat member",
    };
  } catch (error: any) {
    console.error(error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || "Terjadi Kesalahan Server",
      data: error.data,
    });
  }
});
