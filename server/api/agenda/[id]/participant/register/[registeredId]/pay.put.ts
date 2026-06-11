import { AgendaModel } from "~~/server/models/AgendaModel";
import { ensureCommitteeOrOrganizer } from "~~/server/utils/agendaAuth";
import { IPayReq } from "~~/types/IRequestPost";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const user = event.context.user;
    const { id, registeredId } = event.context.params as {
      id: string;
      registeredId: string;
    };
    const { paymentMethod } = await readBody<IPayReq>(event);

    const { ParticipantModel } = await import("~~/server/models/ParticipantModel");

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
    const participant = await ParticipantModel.findById(registeredId);
    if (!participant || participant.agendaId.toString() !== id) {
      throw createError({
        statusCode: 404,
        statusMessage: "Participant user not found",
      });
    }
    if (!participant.payment) {
      throw createError({
        statusCode: 400,
        statusMessage: "Payment data not found",
      });
    }
    // Check if the payment method is valid
    // if (paymentMethod !== ) {
    //   throw createError({
    //     statusCode: 400,
    //     statusMessage: "Invalid payment method",
    //   });
    // }
    // Check if the payment method is already paid
    if (participant.payment.status === "success") {
      throw createError({
        statusCode: 400,
        statusMessage: "Payment already completed",
      });
    }
    participant.payment.status = "success";
    participant.payment.time = new Date();

    await participant.save();
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
