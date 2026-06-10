import { AgendaModel } from "~~/server/models/AgendaModel";
import { ensureCommitteeOrOrganizer } from "~~/server/utils/agendaAuth";
import { ICommittee, IGuest, IMember, IParticipant } from "~~/types";

export default defineEventHandler(async (event) => {
  // 1. Validasi Auth & Input
  const user = event.context.user;
  const payload = await readBody(event);
  const agendaId = getRouterParam(event, "id");
  const { code } = payload; // code = registeredId (misal: "REG-123456")
  const { id, role } = JSON.parse(code);

  if (!code || !id || !role) {
    throw createError({ statusCode: 400, message: "QR Code tidak valid" });
  }

  // 2. Cari Agenda
  const agenda = await AgendaModel.findById(agendaId);
  if (!agenda) {
    throw createError({ statusCode: 404, message: "Agenda tidak ditemukan" });
  }

  // 2.5 Auth: Hanya committee/organizer yang bisa scan
  await ensureCommitteeOrOrganizer(agenda._id.toString(), user);

  // 3. Cari Data Peserta/Panitia di dalam Agenda tersebut
  const { ParticipantModel } = await import("~~/server/models/ParticipantModel");
  const { CommitteeModel } = await import("~~/server/models/CommitteeModel");

  let roleFound = "Participant";
  let participant: any = await ParticipantModel.findById(id).populate("member").populate("guest");

  // Jika tidak ketemu, cari di array committees
  if (!participant) {
    participant = await CommitteeModel.findById(id).populate("member");
    roleFound = "Committee";
  }

  // Jika masih tidak ketemu
  if (!participant || participant.agendaId.toString() !== agendaId) {
    throw createError({
      statusCode: 404,
      message: "Data peserta tidak ditemukan di agenda ini.",
    });
  }

  // 4. Validasi Status Pembayaran (hanya jika role tersebut butuh bayar)
  const roleConfig = roleFound === "Participant"
    ? agenda.configuration?.participant
    : agenda.configuration?.committee;

  if (roleConfig?.pay && participant.payment?.status !== "success") {
    // Jika ingin strict (harus bayar dulu):
    throw createError({
      statusCode: 402,
      message: "Peserta belum melunasi pembayaran.",
    });
    // Atau sekadar warning di frontend nanti
  }

  // 5. Cek apakah sudah presensi (visited)
  if (participant.visiting) {
    throw createError({
      statusCode: 409, // Conflict
      message: `Sudah check-in pada: ${new Date(
        participant.visitAt || Date.now()
      ).toLocaleTimeString()}`,
    });
  }

  // 6. Update Status Presensi
  participant.visiting = true;
  participant.visitAt = new Date();
  await participant.save();

  let memberData: IMember | IGuest | undefined;
  if (roleFound === "Participant") {
    if (!participant.member) {
      memberData = participant.guest as IGuest;
    } else {
      memberData = participant.member as IMember;
    }
  } else {
    memberData = participant.member as IMember;
  }

  // 7. Trigger Email Check-In via QStash
  if (memberData && memberData.email) {
    const { Client } = await import("@upstash/qstash");
    const qstashClient = new Client({ token: process.env.QSTASH_TOKEN || "" });
    const config = useRuntimeConfig();
    const webhookUrl = `${config.public.public_uri}/api/webhooks/qstash/email`;

    qstashClient.publishJSON({
      url: webhookUrl,
      body: {
        type: "check-in-success",
        agendaTitle: agenda.title,
        agendaId: agenda._id.toString(),
        name: memberData.fullName,
        email: memberData.email,
        visitTime: participant.visitAt.toISOString(),
      }
    }).catch((e) => console.error("Failed to publish check-in to QStash", e));
  }

  // 8. Return Data
  return {
    status: "success",
    role: roleFound,
    participant: {
      name: memberData?.fullName || "N/A",
      email: memberData?.email || "N/A",
      phone: memberData?.phone || "N/A",
      NIM: memberData?.NIM || "N/A",
      class: memberData?.class || "N/A",
      semester: memberData?.semester || "N/A",
      institution: (memberData as IGuest)?.instance || "ITSNU Pekalongan",
    },
  };
});
