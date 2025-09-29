import { AgendaModel } from "~~/server/models/AgendaModel";
import { IPayReq } from "~~/types/IRequestPost";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  const { id, registeredId } = event.context.params as {
    id: string;
    registeredId: string;
  };
  const { paymentMethod } = await readBody<IPayReq>(event);
  try {
    // Find the agenda by ID
    const agenda = await AgendaModel.findById(id);
    if (!agenda) {
      return {
        statusCode: 404,
        statusMessage: "Agenda not found",
      };
    }
    // Find the registered user by ID
    const participant = agenda.participants?.find(
      (reg) => reg._id?.toString() === registeredId
    );
    if (!participant) {
      return {
        statusCode: 404,
        statusMessage: "Participant user not found",
      };
    }
    if (!participant.payment) {
      return {
        statusCode: 400,
        statusMessage: "Payment data not found",
      };
    }
    // Check if the payment method is valid
    if (paymentMethod === "transfer") {
      return {
        statusCode: 400,
        statusMessage: "Invalid payment method",
      };
    }
    // Check if the payment method is already paid
    if (participant.payment.status === "success") {
      return {
        statusCode: 400,
        statusMessage: "Payment already completed",
      };
    }
    participant.payment.status = "success";
    participant.payment.time = new Date();

    await agenda.save();
    return {
      statusCode: 200,
      statusMessage: "Payment link created",
      // data: {
      //   payment_link: registered.paymentLink,
      // },
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      statusMessage: error.statusMessage || error.message,
    };
  }
});
