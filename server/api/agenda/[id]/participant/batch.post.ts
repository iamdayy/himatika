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
    // Menerima array NIM: { nims: [123, 456, 789] }
    const body = await readBody<{ nims: number[] }>(event);

    if (!id || !body.nims || body.nims.length === 0) {
      throw createError({ statusCode: 400, statusMessage: "Data kosong" });
    }

    const agenda = await AgendaModel.findById(id);
    if (!agenda)
      throw createError({ statusCode: 404, statusMessage: "Agenda not found" });

    // 2. Cari Member berdasarkan NIM sekaligus (Bulk Find)
    const members = await MemberModel.find({ NIM: { $in: body.nims } });

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

    members.forEach((member) => {
      // Jika member belum ada di participants, masukkan
      if (!existingMemberIds.includes(member.id.toString())) {
        agenda.participants?.push({
          member: member.id as any,
          payment: {
            status: "success",
            method: "cash",
          },
          visiting: true,
          visitAt: new Date().toString(),
        });
        addedCount++;
      }
    });

    await agenda.save();

    return {
      statusCode: 200,
      statusMessage: `Berhasil menambahkan ${addedCount} peserta dari ${body.nims.length} data.`,
    };
  } catch (error: any) {
    console.error("Batch participant error:", error);
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Internal Server Error",
    });
  }
});
