import { AgendaModel } from "~~/server/models/AgendaModel";
import { getTransactionStatus } from "~~/server/utils/midtrans";
import { IReqPaymentQuery } from "~~/types/IRequestPost";
import { IError, IPaymentResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IPaymentResponse | IError> => {
    const { transaction_id } = getQuery<IReqPaymentQuery>(event);
    try {
      const { ParticipantModel } = await import("~~/server/models/ParticipantModel");
      const { CommitteeModel } = await import("~~/server/models/CommitteeModel");

      let registered = await ParticipantModel.findOne({ "payment.transaction_id": transaction_id });
      if (!registered) {
        registered = await CommitteeModel.findOne({ "payment.transaction_id": transaction_id });
      }

      if (!registered) {
        throw createError({
          statusCode: 404,
          statusMessage: "Pendaftaran tidak ditemukan",
        });
      }

      if (!registered.payment) {
        throw createError({
          statusCode: 404,
          statusMessage: "Pembayaran tidak ditemukan",
        });
      }

      // Midtrans status endpoint is keyed by ORDER id, not transaction id —
      // the old call queried the wrong identifier and always mapped to
      // "pending". Skip the remote probe entirely when no order id exists.
      let response: string = "unknown";
      const orderId = registered.payment.order_id;
      if (orderId && !String(orderId).startsWith("MANUAL-")) {
        try {
          response = await getTransactionStatus(String(orderId));
        } catch (e: any) {
          console.warn("[payment-status] Midtrans lookup failed:", e?.message);
        }
      }
      // READ-ONLY status probe. The old code persisted the polled Midtrans
      // status here from an anonymous, unauthenticated request — bypassing
      // the signed-webhook state machine (could resurrect `pending` over
      // `verifying`, etc.). The webhook remains the sole mutation source.
      return {
        statusCode: 200,
        statusMessage: "Transaksi ditemukan",
        data: {
          payment: {
            status: registered?.payment?.status || "pending",
            midtrans_status: response,
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
