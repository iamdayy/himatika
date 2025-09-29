import { AgendaModel } from "~~/server/models/AgendaModel";
import { getTransactionStatus } from "~~/server/utils/midtrans";
import { IReqPaymentQuery } from "~~/types/IRequestPost";
import { IError, IResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IResponse | IError> => {
    const { transaction_id } = getQuery<IReqPaymentQuery>(event);
    try {
      const response = await getTransactionStatus(transaction_id);
      if (response.status_code === "404") {
        throw createError({
          statusCode: 404,
          statusMessage: "Failed to find transaction",
          data: { message: response.status_message },
        });
      }

      const agenda = await AgendaModel.findOne({
        "registered.payment.transaction_id": transaction_id,
      });
      if (!agenda) {
        throw createError({
          statusCode: 404,
          statusMessage: "Agenda & registration not found",
        });
      }
      const registered = agenda.registered?.find(
        (r) => r.payment?.transaction_id === transaction_id
      );
      if (!registered || !registered.payment) {
        throw createError({
          statusCode: 404,
          statusMessage: "Transaction not found",
        });
      }
      const cancel = await cancelPayment(transaction_id);
      if (cancel.status_code !== "200") {
        throw createError({
          statusCode: 500,
          statusMessage: "Failed to cancel transaction",
          data: { message: cancel.status_message },
        });
      }
      registered.payment = {
        ...registered.payment,
        status: "canceled",
        transaction_id: "",
        order_id: "",
        bank: "",
        expiry: undefined,
      };
      await agenda.save();
      return {
        statusCode: 200,
        statusMessage: "Transaction canceled",
      };
    } catch (error: any) {
      throw createError({
        statusCode: 500,
        statusMessage: "Internal Server Error",
        data: { message: error.message },
      });
    }
  }
);
