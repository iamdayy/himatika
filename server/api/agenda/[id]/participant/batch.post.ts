import { AgendaModel } from "~~/server/models/AgendaModel";
import { MemberModel } from "~~/server/models/MemberModel"; // Pastikan import ini ada
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    // 1. Auth Check
    const user = event.context.user;
    if (!user || !user.member.organizer) {
      throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    }

    const { id } = event.context.params as { id: string };
    // Menerima array data: { data: [{ nim: 123, payment: {...}, visiting: true }, ...] }
    const body = await readBody<{
      data: { nim: number; payment: any; visiting: boolean }[];
    }>(event);

    if (!id || !body.data || body.data.length === 0) {
      throw createError({ statusCode: 400, statusMessage: "Data kosong" });
    }

    const agenda = await AgendaModel.findById(id);
    if (!agenda)
      throw createError({ statusCode: 404, statusMessage: "Agenda not found" });

    // 2. Cari Member berdasarkan NIM sekaligus (Bulk Find)
    const nims = body.data.map((d) => d.nim);
    const members = await MemberModel.find({ NIM: { $in: nims } });

    if (members.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Tidak ada NIM yang ditemukan dalam database member",
      });
    }

    // 3. Filter Duplikasi (Cek apakah sudah terdaftar di agenda ini)
    const existingMemberIds =
      agenda.participants?.map((p) => p.member?.toString()) || [];
    let addedCount = 0;

    body.data.forEach((reqItem) => {
      const member = members.find((m) => m.NIM === reqItem.nim);
      // Jika member belum ada di participants, masukkan
      if (member && !existingMemberIds.includes(member.id.toString())) {
        agenda.participants?.push({
          member: member.id as any,
          payment: reqItem.payment || {
            status: "success",
            method: "cash",
          },
          visiting: reqItem.visiting || false,
          visitAt: reqItem.visiting ? new Date().toString() : undefined,
          visitTime: reqItem.visiting ? new Date() : undefined,
        });
        addedCount++;
      }
    });

    await agenda.save();

    return {
      statusCode: 200,
      statusMessage: `Berhasil menambahkan ${addedCount} peserta dari ${body.data.length} data.`,
    };
  } catch (error: any) {
    console.error("Batch participant error:", error);
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Internal Server Error",
    });
  }
});
