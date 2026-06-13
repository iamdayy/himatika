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
    const participant = await ParticipantModel.findById(registeredId).populate("member").populate("guest");
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

    // Trigger payment-success email
    const { Client } = await import("@upstash/qstash");
    const qstashClient = new Client({ token: process.env.QSTASH_TOKEN || "" });
    const config = useRuntimeConfig();

    const customerName = participant.member ? (participant.member as any).fullName : (participant.guest as any)?.fullName || "";
    const customerEmail = participant.member ? (participant.member as any).email : (participant.guest as any)?.email || "";

    qstashClient.publishJSON({
      url: `${config.public.public_uri}/api/webhooks/qstash/email`,
      body: {
        type: "payment-success",
        agendaTitle: agenda.title,
        agendaId: agenda._id,
        participantId: registeredId,
        name: customerName,
        email: customerEmail,
        amount: participant.payment.amount || 0,
      },
    }).catch((e) => console.error("Failed to publish manual pay-success", e));

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
