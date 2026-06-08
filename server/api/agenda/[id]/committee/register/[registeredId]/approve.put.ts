import { AgendaModel } from "~~/server/models/AgendaModel";
import { ensureCommitteeOrOrganizer } from "~~/server/utils/agendaAuth";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const user = event.context.user;
    const { id, registeredId } = event.context.params as {
      id: string;
      registeredId: string;
    };
    const agenda = await AgendaModel.findById(id);
    if (!agenda) {
      throw createError({
        statusCode: 404,
        statusMessage: "Agenda not found",
      });
    }

    const { CommitteeModel } = await import("~~/server/models/CommitteeModel");
    
    // Only committee or organizer can approve
    await ensureCommitteeOrOrganizer(agenda._id.toString(), user);

    const committee = await CommitteeModel.findById(registeredId);
    if (!committee || committee.agendaId.toString() !== id) {
      throw createError({
        statusCode: 404,
        statusMessage: "Committee not found",
      });
    }

    committee.approved = true;
    committee.approvedAt = new Date();
    await committee.save();
    return {
      statusCode: 200,
      statusMessage: "Success approved",
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message,
    });
  }
});
