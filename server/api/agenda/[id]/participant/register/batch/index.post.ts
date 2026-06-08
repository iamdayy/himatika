import { AgendaModel } from "~~/server/models/AgendaModel";
import { ParticipantModel } from "~~/server/models/ParticipantModel";
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

    await ensureCommitteeOrOrganizer(agenda._id.toString(), user);

    const participants = await ParticipantModel.find({ _id: { $in: body.participants } });
    
    const bulkOps = participants.map((participant) => {
      let updateDoc: any = {};
      if (body.field === "payment") {
        updateDoc = {
          "payment.status": "success"
        };
      } else if (body.field === "visiting") {
        const newVisiting = !participant.visiting;
        updateDoc = {
          visiting: newVisiting,
          visitTime: newVisiting ? new Date() : null
        };
      }
      return {
        updateOne: {
          filter: { _id: participant._id },
          update: { $set: updateDoc }
        }
      };
    });

    if (bulkOps.length > 0) {
      await ParticipantModel.bulkWrite(bulkOps);
    }
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
