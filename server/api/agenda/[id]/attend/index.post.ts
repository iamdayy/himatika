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
    const { MemberModel } = await import("~~/server/models/MemberModel");
    const member = await MemberModel.findOne({ NIM: user.member.NIM });
    if (member) {
      const { ParticipantModel } = await import("~~/server/models/ParticipantModel");
      participant = await ParticipantModel.findOne({ agendaId, member: member._id });
      const { CommitteeModel } = await import("~~/server/models/CommitteeModel");
      committee = await CommitteeModel.findOne({ agendaId, member: member._id });
    }
  } else if (user.guest) {
    const { ParticipantModel } = await import("~~/server/models/ParticipantModel");
    participant = await ParticipantModel.findOne({ agendaId, guest: user.guest._id });
    // Guests cannot be committee members (yet)
  }

  if (!participant && !committee) {
    throw createError({
      statusCode: 403,
      message: "Anda belum terdaftar di agenda ini.",
    });
  }

  const userDataInAgenda = participant || committee;

  if (userDataInAgenda?.visiting) {
    return {
      status: "already_checked_in",
      message: "Anda sudah presensi sebelumnya",
      visitedAt: userDataInAgenda.visitAt,
    };
  }

  // 6. Update Database: Set visited = true
  if (participant) {
    participant.visiting = true;
    participant.visitAt = new Date().toISOString();
    participant.visitTime = new Date();
    await participant.save();
  } else if (committee) {
    committee.visiting = true;
    committee.visitAt = new Date().toISOString();
    committee.visitTime = new Date();
    await committee.save();
  }

  return {
    status: "success",
    message: "Presensi berhasil dicatat!",
    role: participant ? (user.guest ? "Tamu" : "Peserta") : "Panitia",
  };
});
