import { AgendaModel } from "~~/server/models/AgendaModel";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  const { id, registeredId } = event.context.params as {
    id: string;
    registeredId: string;
  };
  try {
    // Find the agenda by ID
    const agenda = await AgendaModel.findById(id);
    if (!agenda) {
      return {
        statusCode: 404,
        statusMessage: "Agenda not found",
      };
    }
    // Find the committee user by ID
    const committee = agenda.committees?.find(
      (reg) => reg._id?.toString() === registeredId
    );
    if (!committee) {
      return {
        statusCode: 404,
        statusMessage: "Committee user not found",
      };
    }
    if (!committee.payment) {
      return {
        statusCode: 400,
        statusMessage: "Payment data not found",
      };
    }
    // Check if the payment method is valid
    if (committee.payment.method === "transfer") {
      return {
        statusCode: 400,
        statusMessage: "Invalid payment method",
      };
    }
    // Check if the payment method is already paid
    if (committee.payment.status === "success") {
      return {
        statusCode: 400,
        statusMessage: "Payment already completed",
      };
    }
    if (typeof committee.payment !== "object") {
      committee.payment = {
        status: "pending",
        type: "other",
        method: "cash",
        time: new Date(),
      };
    }
    committee.payment.status = "success";
    committee.payment.method = "cash";
    committee.payment.time = new Date();

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
