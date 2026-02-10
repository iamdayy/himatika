import { AgendaModel } from "~~/server/models/AgendaModel";
import { IMember } from "~~/types";

export default defineEventHandler(async (event) => {
  // 1. Cek User Login
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      message: "Harap login terlebih dahulu",
    });
  }

  // 2. Ambil ID Agenda dari params
  const { id: agendaId } = event.context.params as { id: string };
  if (!agendaId) {
    throw createError({ statusCode: 400, message: "QR Code tidak valid" });
  }

  // 3. Cari Agenda
  const agenda = await AgendaModel.findById(agendaId);
  if (!agenda) {
    throw createError({ statusCode: 404, message: "Agenda tidak ditemukan" });
  }

  // 4. Cari User di daftar Peserta atau Panitia
  const participant = agenda.participants?.find(
    (p) => ((p.member as IMember) || null)?.NIM === user.member.NIM
  );
  const committee = agenda.committees?.find(
    (c) => ((c.member as IMember) || null)?.NIM === user.member.NIM
  );

  if (!participant && !committee) {
    throw createError({
      statusCode: 403,
      message: "Anda belum terdaftar di agenda ini.",
    });
  }

  // 5. Cek apakah sudah presensi sebelumnya
  const targetCollection = participant ? "participants" : "committees";

  // Cek status visited
  const currentList = participant ? agenda.participants : agenda.committees;
  const userDataInAgenda = currentList?.find(
    (u) => ((u.member as IMember) || null)?.NIM === user.member.NIM
  );

  if (userDataInAgenda?.visiting) {
    return {
      status: "already_checked_in",
      message: "Anda sudah presensi sebelumnya",
      visitedAt: userDataInAgenda.visitAt,
    };
  }

  // 6. Update Database: Set visited = true
  const updateResult = await AgendaModel.updateOne(
    { _id: agendaId, [`${targetCollection}._id`]: participant?._id || committee?._id },
    {
      $set: {
        [`${targetCollection}.$.visiting`]: true,
        [`${targetCollection}.$.visitAt`]: new Date(),
      },
    }
  );
  console.log(updateResult);

  if (!updateResult.modifiedCount) {
    throw createError({
      statusCode: 500,
      message: "Gagal update database",
    });
  }

  return {
    status: "success",
    message: "Presensi berhasil dicatat!",
    role: participant ? "Peserta" : "Panitia",
  };
});
