import { AgendaModel } from "~~/server/models/AgendaModel";
import { createCharge } from "~~/server/utils/midtrans";
import { IMember } from "~~/types";
import { IPaymentBody } from "~~/types/IRequestPost";
import { IError, IPaymentResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (ev): Promise<IPaymentResponse | IError> => {
    try {
      const { id, registeredId } = ev.context.params as {
        id: string;
        registeredId: string;
      };
      const body = await readBody<IPaymentBody>(ev);
      const agenda = await AgendaModel.findById(id);
      if (!agenda) {
        throw createError({
          statusCode: 400,
          statusMessage: "Agenda not found",
        });
      }
      const participant = agenda.participants?.find(
        (r) => r._id?.toString() === registeredId
      );
      if (!participant) {
        throw createError({
          statusCode: 400,
          statusMessage: "Participant not found",
        });
      }
      if (participant.payment?.status === "success") {
        throw createError({
          statusCode: 400,
          statusMessage: "Payment already completed",
        });
      }
      if (
        participant.payment?.status === "pending" &&
        new Date(participant.payment?.expiry as Date) >= new Date()
      ) {
        return {
          statusCode: 200,
          statusMessage: "Payment found",
          data: {
            payment: participant.payment,
          },
        };
      }
      const amount = agenda.configuration.participant.amount;
      const payment = await createCharge({
        payment_type: body.payment_type,
        bank_transfer: {
          bank: body.bank_transfer || "bca",
        },
        credit_card: body.credit_card,
        transaction_details: {
          order_id: registeredId,
          gross_amount: amount ? amount + amount + 2500 : 0,
        },
        customer_details: {
          first_name:
            typeof participant.member === "object"
              ? (participant.member as IMember).fullName
              : participant.guest?.fullName || "",
          email:
            typeof participant.member === "object"
              ? (participant.member as IMember).email
              : participant.guest?.email || "",
          phone:
            typeof participant.member === "object"
              ? (participant.member as IMember).phone || ""
              : participant.guest?.phone || "",
        },
      });
      participant.payment = {
        ...participant.payment,
        status: "pending",
        type: body.payment_type,
        method: "transfer",
        order_id: payment.order_id,
        transaction_id: payment.transaction_id,
        expiry: new Date(payment.expiry_time),
        time: new Date(payment.transaction_time),
        bank: payment.va_numbers[0].bank,
        va_number: payment.va_numbers[0].va_number,
      };
      agenda.save();
      return {
        statusCode: 200,
        statusMessage: "Payment created",
        data: {
          payment: participant.payment,
        },
      };
    } catch (error: any) {
      console.error("Error creating payment:", error);
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || "Internal server error",
      });
    }
  }
);
