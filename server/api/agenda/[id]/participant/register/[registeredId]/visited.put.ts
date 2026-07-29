import { ParticipantModel } from "~~/server/models/ParticipantModel";
import { AgendaModel } from "~~/server/models/AgendaModel";
import { ensureCommitteeOrOrganizer } from "~~/server/utils/agendaAuth";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const user = event.context.user;
    if (!user) {
      return {
        statusCode: 401,
        statusMessage: "Unauthorized",
      };
    }

    const { id, registeredId } = event.context.params as {
      id: string;
      registeredId: string;
    };

    // Verify agenda exists
    const agenda = await AgendaModel.findById(id);
    if (!agenda) {
      return {
        statusCode: 404,
        statusMessage: "Agenda not found",
      };
    }

    // Auth: only committee or organizer can set attendance
    await ensureCommitteeOrOrganizer(agenda._id.toString(), user);

    // Find participant using the decoupled ParticipantModel
    const participant = await ParticipantModel.findOne({
      _id: registeredId,
      agendaId: id,
    });

    if (!participant) {
      return {
        statusCode: 404,
        statusMessage: "Participant not found",
      };
    }

    // Toggle visiting status
    const newVisiting = !participant.visiting;
    participant.visiting = newVisiting;
    participant.visitAt = newVisiting ? new Date().toISOString() : undefined;
    participant.visitTime = newVisiting ? new Date() : undefined;
    await participant.save();

    return {
      statusCode: 200,
      statusMessage: newVisiting
        ? "Participant marked as visited"
        : "Participant visit status cancelled",
    };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message,
    };
  }
});
