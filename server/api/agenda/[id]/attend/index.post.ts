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

  // Payment gate — mirrors the committee scanner flow (previously anyone
  // could self-check-in without paying).
  const roleConfig = committee
    ? agenda.configuration?.committee
    : agenda.configuration?.participant;
  if (roleConfig?.pay && userDataInAgenda?.payment?.status !== "success") {
    throw createError({
      statusCode: 402,
      message: "Presensi belum dapat dilakukan karena pembayaran belum terverifikasi.",
    });
  }

  // Event time window (with a 12h buffer on each side) when dates are set.
  const now = Date.now();
  const BUFFER_MS = 12 * 60 * 60 * 1000;
  if (agenda.date?.start && now < new Date(agenda.date.start).getTime() - BUFFER_MS) {
    throw createError({ statusCode: 409, message: "Presensi belum dibuka — acara belum dimulai." });
  }
  if (agenda.date?.end && now > new Date(agenda.date.end).getTime() + BUFFER_MS) {
    throw createError({ statusCode: 409, message: "Presensi sudah ditutup — acara telah berakhir." });
  }

  if (userDataInAgenda?.visiting) {
    return {
      status: "already_checked_in",
      message: "Anda sudah presensi sebelumnya",
      visitedAt: userDataInAgenda.visitAt,
    };
  }

  // 6. Update Database atomically — racing requests cannot both succeed.
  const scanTime = new Date();
  const Model: any = participant
    ? (await import("~~/server/models/ParticipantModel")).ParticipantModel
    : (await import("~~/server/models/CommitteeModel")).CommitteeModel;
  const checkIn = await Model.updateOne(
    { _id: userDataInAgenda._id, visiting: { $ne: true } },
    { $set: { visiting: true, visitAt: scanTime.toISOString(), visitTime: scanTime } }
  );
  if (checkIn.modifiedCount === 0) {
    return {
      status: "already_checked_in",
      message: "Anda sudah presensi sebelumnya",
      visitedAt: userDataInAgenda.visitAt,
    };
  }

  return {
    status: "success",
    message: "Presensi berhasil dicatat!",
    role: participant ? (user.guest ? "Tamu" : "Peserta") : "Panitia",
  };
});
