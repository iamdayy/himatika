import { ParticipantModel } from "~~/server/models/ParticipantModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { GuestModel } from "~~/server/models/GuestModel";

export default defineEventHandler(async (event) => {
  try {
    const { id, participantId } = event.context.params as {
      id: string;
      participantId: string;
    };
    const body = await readBody(event);
    const { email } = body;

    if (!email) {
      throw createError({ statusCode: 400, statusMessage: "Email is required" });
    }

    const participant = await ParticipantModel.findOne({ agendaId: id, _id: participantId }).lean();
    if (!participant) {
      throw createError({ statusCode: 404, statusMessage: "Participant not found" });
    }

    let actualEmail = "";
    if (participant.member) {
      const member = await MemberModel.findById(participant.member).lean();
      if (member) actualEmail = member.email;
    } else if (participant.guest) {
      const guest = await GuestModel.findById(participant.guest).lean();
      if (guest) actualEmail = guest.email;
    }

    if (actualEmail.toLowerCase() !== email.toLowerCase()) {
      throw createError({ statusCode: 401, statusMessage: "Email tidak cocok dengan data pendaftaran" });
    }

    return {
      statusCode: 200,
      statusMessage: "Verifikasi berhasil",
      data: {
        verified: true,
      }
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    });
  }
});
