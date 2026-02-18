import { AgendaModel } from "~~/server/models/AgendaModel";
import { IGuest, IMember } from "~~/types";

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
  let participant: any = null;
  let committee: any = null;

  if (user.member) {
      participant = agenda.participants?.find(
        (p) => ((p.member as IMember) || null)?.NIM === user.member.NIM
      );
      committee = agenda.committees?.find(
        (c) => ((c.member as IMember) || null)?.NIM === user.member.NIM
      );
  } else if (user.guest) {
      participant = agenda.participants?.find(
          (p) => {
              const pGuestId = (p.guest as IGuest)?._id || p.guest;
              const userGuestId = user.guest._id;
              return pGuestId?.toString() === userGuestId?.toString();
          }
      );
      // Guests cannot be committee members (yet)
  }

  if (!participant && !committee) {
    throw createError({
      statusCode: 403,
      message: "Anda belum terdaftar di agenda ini.",
    });
  }

  // 5. Cek apakah sudah presensi sebelumnya
  const targetCollection = participant ? "participants" : "committees";

  // Cek status visited
  // We already found the specific participant object above, but to be safe/consistent with original code style:
  const userDataInAgenda = participant || committee;

  if (userDataInAgenda?.visiting) {
    return {
      status: "already_checked_in",
      message: "Anda sudah presensi sebelumnya",
      visitedAt: userDataInAgenda.visitAt,
    };
  }

  // 6. Update Database: Set visited = true
  // Note: participant._id is the _id of the subdocument in the array, NOT the member/guest ID.
  // So we can use that to uniquely identify the array element to update.
  const subDocId = participant?._id || committee?._id;

  const updateResult = await AgendaModel.updateOne(
    { _id: agendaId, [`${targetCollection}._id`]: subDocId },
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
    role: participant ? (user.guest ? "Tamu" : "Peserta") : "Panitia",
  };
});
