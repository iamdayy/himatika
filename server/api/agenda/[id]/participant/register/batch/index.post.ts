import { AgendaModel } from "~~/server/models/AgendaModel";
import { ensureCommitteeOrOrganizer } from "~~/server/utils/agendaAuth";
import { IReqParticipantBatch } from "~~/types/IRequestPost";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const user = event.context.user;

    const { id } = event.context.params as { id: string };
    const body = await readBody<IReqParticipantBatch>(event);
    if (!body || !body.participants || !body.field) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid request body",
      });
    }
    const agenda = await AgendaModel.findById(id);
    if (!agenda) {
      throw createError({
        statusCode: 404,
        statusMessage: "Agenda not found",
      });
    }

    ensureCommitteeOrOrganizer(agenda, user);

    const updatedParticipants = agenda.participants?.map((participant) => {
      if (body.participants.includes(participant._id?.toString() || "")) {
        if (body.field === "payment") {
          if (participant.payment) {
            participant.payment.status = "success";
          }
        } else if (body.field === "visiting") {
          participant.visiting = !participant.visiting;
          participant.visitTime = participant.visiting ? new Date() : undefined;
        }
      }
      return participant;
    });
    agenda.participants = updatedParticipants;
    await agenda.save();
    return {
      statusCode: 200,
      statusMessage: "Participants updated successfully",
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message,
    });
  }
});
