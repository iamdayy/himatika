import { AgendaModel } from "~~/server/models/AgendaModel";
import { getTransactionStatus } from "~~/server/utils/midtrans";
import { IReqPaymentQuery } from "~~/types/IRequestPost";
import { IError, IPaymentResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IPaymentResponse | IError> => {
    const { transaction_id } = getQuery<IReqPaymentQuery>(event);
    try {
      const response = await getTransactionStatus(transaction_id);
      const agenda = await AgendaModel.findOne({
        $or: [
          { "participants.payment.transaction_id": transaction_id },
          { "committees.payment.transaction_id": transaction_id },
        ],
      });
      if (!agenda) {
        throw createError({
          statusCode: 404,
          statusMessage: "Agenda & pendaftaran tidak ditemukan",
        });
      }
      const registered =
        agenda.participants?.find(
          (r) => r.payment?.transaction_id === transaction_id
        ) ||
        agenda.committees?.find(
          (r) => r.payment?.transaction_id === transaction_id
        );
      if (!registered) {
        throw createError({
          statusCode: 404,
          statusMessage: "Peserta tidak ditemukan",
        });
      }
      if (!registered.payment) {
        throw createError({
          statusCode: 404,
          statusMessage: "Pembayaran tidak ditemukan",
        });
      }
      registered.payment.status = response;
      agenda.markModified("participants");
      agenda.markModified("committees");
      await agenda.save();
      return {
        statusCode: 200,
        statusMessage: "Transaksi ditemukan",
        data: {
          payment: {
            status: registered?.payment?.status || "pending",
          },
        },
      };
    } catch (error: any) {
      console.error("Error in payment status:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Terjadi Kesalahan Server",
        data: { message: error.message },
      });
    }
  }
);
