import { AgendaModel } from "~~/server/models/AgendaModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { CommitteeModel } from "~~/server/models/CommitteeModel";

export default defineEventHandler(async (event): Promise<any> => {
  try {
    const user = event.context.user;
    if (!user || !user.member.organizer) throw createError({ statusCode: 403 });

    const { id } = event.context.params as { id: string };
    // Menerima array: [{ nim: 123, job: 'Sekretaris', payment?: any, visiting?: boolean }, ...]
    const body = await readBody<{
      data: { nim: number; job: string; payment?: any; visiting?: boolean }[];
    }>(event);

    if (!id || !body.data || body.data.length === 0)
      throw createError({ statusCode: 400 });

    const agenda = await AgendaModel.findById(id);
    if (!agenda) throw createError({ statusCode: 404 });

    // Ambil list NIM dari request
    const nims = body.data.map((d) => d.nim);
    const members = await MemberModel.find({ NIM: { $in: nims } });

    const existingCommittees = await CommitteeModel.find({ agendaId: id });
    const existingCommitteeIds = existingCommittees.map((c) => c.member?.toString());

    let addedCount = 0;
    const failedMembers: any[] = [];
    const newCommittees: any[] = [];

    // Loop data request untuk mencocokkan jabatan
    body.data.forEach((reqItem) => {
      const member = members.find((m) => m.NIM === reqItem.nim);
      if (member && !existingCommitteeIds.includes(member.id.toString())) {
        newCommittees.push({
          agendaId: id,
          member: member.id,
          job: reqItem.job || "Anggota", // Default job
          approved: true, // Auto approve karena import admin
          payment: reqItem.payment,
          visiting: reqItem.visiting,
          visitTime: reqItem.visiting ? new Date() : undefined
        });
        addedCount++;
      } else {
        failedMembers.push(reqItem);
      }
    });

    if (newCommittees.length > 0) {
      await CommitteeModel.insertMany(newCommittees);
    }

    return {
      statusCode: 200,
      statusMessage: `Berhasil menambahkan ${addedCount} panitia. ${failedMembers.length} gagal.`,
      data: {
        savedCount: addedCount,
        failedCount: failedMembers.length,
        failedMembers
      }
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Internal Server Error",
    });
  }
});
