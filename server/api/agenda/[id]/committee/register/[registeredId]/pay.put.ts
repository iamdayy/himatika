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

    const { CommitteeModel } = await import("~~/server/models/CommitteeModel");

    // Find the agenda by ID
    const agenda = await AgendaModel.findById(id);
    if (!agenda) {
      throw createError({
        statusCode: 404,
        statusMessage: "Agenda not found",
      });
    }

    // Only committee or organizer can manually mark payment
    await ensureCommitteeOrOrganizer(agenda._id.toString(), user);

    // Find the registered user by ID
    const committee = await CommitteeModel.findById(registeredId);
    if (!committee || committee.agendaId.toString() !== id) {
      throw createError({
        statusCode: 404,
        statusMessage: "Committee user not found",
      });
    }

    if (!committee.payment) {
      throw createError({
        statusCode: 400,
        statusMessage: "Payment data not found",
      });
    }

    // Check if the payment method is already paid
    if (committee.payment.status === "success") {
      throw createError({
        statusCode: 400,
        statusMessage: "Payment already completed",
      });
    }
    committee.payment.status = "success";
    committee.payment.method = "cash";
    committee.payment.time = new Date();

    await committee.save();
    return {
      statusCode: 200,
      statusMessage: "Payment marked as success",
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message,
    });
  }
});
