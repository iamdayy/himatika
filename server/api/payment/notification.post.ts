import { AgendaModel } from "~~/server/models/AgendaModel";
import { verifySignature } from "~~/server/utils/midtrans";
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
    // Verify signature first (fail fast)
    if (status_code === "200") {
      const verified = verifySignature(body);
      if (!verified) {
        throw createError({
          statusCode: 400,
          statusMessage: "Tanda tangan tidak valid",
        });
      }

      // 1. Handle SUCCESS (Settlement)
      if (transaction_status === "settlement" && fraud_status === "accept") {
        const updateDoc = {
          "payment.status": "success",
          $unset: {
            "payment.expiry": "",
            "payment.va_number": ""
          }
        };

        const { ParticipantModel } = await import("~~/server/models/ParticipantModel");
        const { CommitteeModel } = await import("~~/server/models/CommitteeModel");

        let result = await CommitteeModel.updateOne({ _id: registeredId }, updateDoc);
        if (result.matchedCount === 0) {
          result = await ParticipantModel.updateOne({ _id: registeredId }, updateDoc);
        }

        if (result.matchedCount === 0) {
             throw createError({ statusCode: 404, statusMessage: "ID Pendaftaran tidak ditemukan" });
        }
      } 
      
      // 2. Handle FAILURE (Cancel, Deny, Expire)
      else if (
        transaction_status === "cancel" ||
        transaction_status === "deny" ||
        transaction_status === "expire"
      ) {
        const updateDoc = {
          "payment.status": "canceled",
          $unset: {
            "payment.expiry": "",
            "payment.va_number": ""
          }
        };

        const { ParticipantModel } = await import("~~/server/models/ParticipantModel");
        const { CommitteeModel } = await import("~~/server/models/CommitteeModel");

        let result = await CommitteeModel.updateOne({ _id: registeredId }, updateDoc);

        if (result.matchedCount === 0) {
            const participant = await ParticipantModel.findById(registeredId);

            if (participant) {
                // Atomic Deletion for Guest
                if (participant.guest) {
                    await ParticipantModel.deleteOne({ _id: registeredId });
                } else {
                    // Atomic Update for Registered User
                    await ParticipantModel.updateOne({ _id: registeredId }, updateDoc);
                }
            }
        }
      }
    }
    return {
      statusCode: 200,
      statusMessage: "Notifikasi diproses secara atomik",
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Terjadi Kesalahan Server",
    });
  }
});
