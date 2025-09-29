import { AgendaModel } from "~~/server/models/AgendaModel";
import { IError, IResponse } from "~~/types/IResponse";
interface midtransNotificationBody {
  order_id: string;
  status_code: string;
  transaction_status: string;
  fraud_status: string;
  payment_type: string;
  transaction_time: string;
  transaction_id: string;
  status_message: string;
  gross_amount: string;
  signature_key: string;
}
export default defineEventHandler(async (ev): Promise<IResponse | IError> => {
  const body = await readBody<midtransNotificationBody>(ev);
  const { status_code, transaction_status, order_id, fraud_status } = body;
  const registeredId = order_id.split(":")[0];
  try {
    // Generate a new ID for the registration
    // Find the agenda by ID
    const agenda = await AgendaModel.findOne({
      "registered._id": registeredId,
    });
    if (!agenda) {
      throw createError({
        statusCode: 404,
        statusMessage: "Agenda not found",
      });
    }
    if (status_code === "200") {
      const verified = verifySignature(body);
      if (!verified) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid signature",
        });
      }
      if (
        transaction_status === "cancel" ||
        transaction_status === "deny" ||
        transaction_status === "expire"
      ) {
        const registration = agenda.registered?.find(
          (reg) => reg._id?.toString() === registeredId
        );
        if (registration) {
          if (!registration.payment) {
            throw createError({
              statusCode: 400,
              statusMessage: "Payment not found",
            });
          }
          registration.payment.status = "canceled";
          registration.payment.va_number = "";
          registration.payment.expiry = undefined;
          registration.payment.transaction_id = "";
          if (registration.guest) {
            agenda.registered = agenda.registered?.filter(
              (reg) => reg._id?.toString() !== registeredId
            );
          }
        }
        await agenda.save();
      }
      if (transaction_status === "settlement" && fraud_status === "accept") {
        // Add the user to the agenda's registered list
        const registration = agenda.registered?.find(
          (reg) => reg._id?.toString() === registeredId
        );
        if (registration) {
          if (!registration.payment) {
            throw createError({
              statusCode: 400,
              statusMessage: "Payment not found",
            });
          }
          registration.payment.status = "success";
          registration.payment.expiry = undefined;
          registration.payment.va_number = "";
        }
        await agenda.save();
      }
    }
    return {
      statusCode: 200,
      statusMessage: "Notification received",
    };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    };
  }
});
