import { AgendaModel } from "~~/server/models/AgendaModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const user = event.context.user;
    if (!user || !user.member.organizer) throw createError({ statusCode: 403 });

    const { id } = event.context.params as { id: string };
    // Menerima array: [{ nim: 123, job: 'Sekretaris' }, ...]
    const body = await readBody<{ data: { nim: number; job: string }[] }>(
      event
    );

    if (!id || !body.data || body.data.length === 0)
      throw createError({ statusCode: 400 });

    const agenda = await AgendaModel.findById(id);
    if (!agenda) throw createError({ statusCode: 404 });

    // Ambil list NIM dari request
    const nims = body.data.map((d) => d.nim);
    const members = await MemberModel.find({ NIM: { $in: nims } });

    const existingCommitteeIds =
      agenda.committees?.map((c) => c.member?.toString()) || [];
    let addedCount = 0;

    // Loop data request untuk mencocokkan jabatan
    body.data.forEach((reqItem) => {
      const member = members.find((m) => m.NIM === reqItem.nim);
      if (member && !existingCommitteeIds.includes(member.id.toString())) {
        agenda.committees?.push({
          member: member.id,
          job: reqItem.job || "Anggota", // Default job
          approved: true, // Auto approve karena import admin
        });
        addedCount++;
      }
    });

    await agenda.save();

    return {
      statusCode: 200,
      statusMessage: `Berhasil menambahkan ${addedCount} panitia.`,
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Internal Server Error",
    });
  }
});
