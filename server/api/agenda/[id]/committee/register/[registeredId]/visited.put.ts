import { CommitteeModel } from "~~/server/models/CommitteeModel";
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

    // Find committee using the decoupled CommitteeModel
    const committee = await CommitteeModel.findOne({
      _id: registeredId,
      agendaId: id,
    });

    if (!committee) {
      return {
        statusCode: 404,
        statusMessage: "Committee not found",
      };
    }

    // Toggle visiting status
    const newVisiting = !committee.visiting;
    committee.visiting = newVisiting;
    committee.visitAt = newVisiting ? new Date().toISOString() : undefined;
    committee.visitTime = newVisiting ? new Date() : undefined;
    await committee.save();

    return {
      statusCode: 200,
      statusMessage: newVisiting
        ? "Committee marked as visited"
        : "Committee visit status cancelled",
    };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message,
    };
  }
});
