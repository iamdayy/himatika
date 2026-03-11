import { AgendaModel } from "~~/server/models/AgendaModel";
import { ICommittee, IGuest, IMember, IParticipant } from "~~/types";

export default defineEventHandler(async (event) => {
  // 1. Validasi Auth & Input
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

  // 3. Cari Data Peserta/Panitia di dalam Agenda tersebut
  // Kita cari di array participants dulu
  let roleFound = "Participant";
  let participant: IParticipant | ICommittee | undefined =
    agenda.participants?.find((p) => p._id?.toString() === id);

  // Jika tidak ketemu, cari di array committees
  if (!participant) {
    participant = agenda.committees?.find((c) => c._id?.toString() === id);
    roleFound = "Committee";
  }

  // Jika masih tidak ketemu
  if (!participant) {
    throw createError({
      statusCode: 404,
      message: "Data peserta tidak ditemukan di agenda ini.",
    });
  }

  // 4. Validasi Status Pembayaran (Opsional, tergantung kebijakan)
  if (participant.payment?.status !== "success") {
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
  if (roleFound === "Participant") {
    await AgendaModel.updateOne(
      { _id: agendaId, "participants._id": participant._id },
      {
        $set: {
          "participants.$.visiting": true,
          "participants.$.visitAt": new Date(),
        },
      }
    );
  } else {
    await AgendaModel.updateOne(
      { _id: agendaId, "committees._id": participant._id },
      {
        $set: {
          "committees.$.visiting": true,
          "committees.$.visitAt": new Date(),
        },
      }
    );
  }

  let memberData: IMember | IGuest | undefined;
  if (roleFound === "Participant") {
    if (!(participant as IParticipant).member) {
      memberData = (participant as IParticipant).guest as IGuest;
    } else {
      memberData = (participant as IParticipant).member as IMember;
    }
  } else {
    memberData = (participant as ICommittee).member as IMember;
  }

  // 7. Return Data
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
