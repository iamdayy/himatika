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

      // Helper for Atomic Status Update
      const updatePaymentStatus = async (
        collectionField: "committees" | "participants",
        status: string
      ) => {
        const setFields: any = {
          [`${collectionField}.$.payment.status`]: status,
        };

        // Clear sensitive/temporary fields on success/cancel
        if (status === "success" || status === "canceled") {
          setFields[`${collectionField}.$.payment.expiry`] = null; // Use null for unsetting in Mongoose (or undefined if strict) - usually null safe
          setFields[`${collectionField}.$.payment.va_number`] = "";
        }
        
        // Use atomic updateOne with $set
        return await AgendaModel.updateOne(
          { [`${collectionField}._id`]: registeredId },
          { $set: setFields }
        );
      };

      // 1. Handle SUCCESS (Settlement)
      if (transaction_status === "settlement" && fraud_status === "accept") {
        // Try updating Committee
        let result = await updatePaymentStatus("committees", "success");
        
        // If not found in committees, try Participants
        if (result.matchedCount === 0) {
          result = await updatePaymentStatus("participants", "success");
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
         // Try updating Committee first (Simple update)
        let result = await updatePaymentStatus("committees", "canceled");

        if (result.matchedCount === 0) {
            // Check Participant for Guest Deletion Logic
            // We read ONLY the specific participant data to check 'guest' status
            const agenda = await AgendaModel.findOne(
                { "participants._id": registeredId },
                { "participants.$": 1 } 
            );

            if (agenda && agenda.participants && agenda.participants[0]) {
                const participant = agenda.participants[0];
                // Atomic Deletion for Guest
                if ((participant as any).guest) {
                    await AgendaModel.updateOne(
                        { _id: agenda._id },
                        { $pull: { participants: { _id: registeredId } } }
                    );
                } else {
                    // Atomic Update for Registered User
                    await updatePaymentStatus("participants", "canceled");
                }
            } else {
                 // Not found in either
                 // Note: We don't throw 404 here usually for notifications to avoid Midtrans retries if it's already gone
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
