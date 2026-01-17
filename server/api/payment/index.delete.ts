import { AgendaModel } from "~~/server/models/AgendaModel";
import { cancelPayment } from "~~/server/utils/midtrans";
import { ICommittee, IParticipant } from "~~/types";
import { IReqPaymentQuery } from "~~/types/IRequestPost";
import { IError, IResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IResponse | IError> => {
    const { transaction_id } = getQuery<IReqPaymentQuery>(event);
    try {
      const user = event.context.user;
      if (!user) {
        throw createError({
          statusCode: 403,
          statusMessage: "You must be logged in to cancel a transaction",
        });
      }

      // Find agenda where this transaction exists AND belongs to the current user
      const agenda = await AgendaModel.findOne({
        $or: [
          {
            "committees.payment.transaction_id": transaction_id,
            "committees.member": user.member._id,
          },
          {
            "participants.payment.transaction_id": transaction_id,
            "participants.member": user.member._id,
          },
        ],
      });

      if (!agenda) {
        throw createError({
          statusCode: 404,
          statusMessage:
            "Transaction not found or you do not have permission to cancel it",
        });
      }
      let registered: IParticipant | ICommittee | undefined;
      
      registered = agenda.committees?.find(
        (r) => r.payment?.transaction_id === transaction_id
      );

      if (!registered) {
        registered = agenda.participants?.find(
          (r) => r.payment?.transaction_id === transaction_id
        );
      }

      // Double check (redundant but safe)
      if (!registered || !registered.payment) {
        throw createError({
          statusCode: 404,
          statusMessage: "Transaction not found",
        });
      }

      // Ensure the registered user matches the authenticated user (extra safety)
      if (registered.member?.toString() !== user.member._id.toString()) {
        throw createError({
          statusCode: 403,
          statusMessage: "Unauthorized action",
        });
      }

      const cancel = await cancelPayment(transaction_id);
      if (cancel.status_code !== "200" && cancel.status_code !== "412") {
        // 412 is "Merchant cannot modify status of the transaction" (already cancelled/settled)
        throw createError({
          statusCode: 500,
          statusMessage: "Failed to cancel transaction from Payment Gateway",
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
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || "Internal Server Error",
        data: error.data,
      });
    }
  }
);
