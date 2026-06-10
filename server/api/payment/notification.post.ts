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

        let participantDoc: any = await CommitteeModel.findById(registeredId).populate("member").populate("guest");
        let isCommittee = true;
        if (!participantDoc) {
          participantDoc = await ParticipantModel.findById(registeredId).populate("member").populate("guest");
          isCommittee = false;
        }

        if (!participantDoc) {
             throw createError({ statusCode: 404, statusMessage: "ID Pendaftaran tidak ditemukan" });
        }

        if (participantDoc.payment?.status === "success") {
            return {
                statusCode: 200,
                statusMessage: "Notification already processed. Ignored for idempotency",
            };
        }

        if (isCommittee) {
            await CommitteeModel.updateOne({ _id: registeredId }, updateDoc);
        } else {
            await ParticipantModel.updateOne({ _id: registeredId }, updateDoc);
        }

        const agenda = await AgendaModel.findById(participantDoc.agendaId);
        if (agenda) {
          const { Client } = await import("@upstash/qstash");
          const qstashClient = new Client({ token: process.env.QSTASH_TOKEN || "" });
          const config = useRuntimeConfig();
          const webhookUrl = `${config.public.public_uri}/api/webhooks/qstash/email`;

          const pName = participantDoc.member?.fullName || participantDoc.guest?.fullName || "Peserta";
          const pEmail = participantDoc.member?.email || participantDoc.guest?.email || "";

          qstashClient.publishJSON({
            url: webhookUrl,
            body: {
              type: "payment-success",
              agendaTitle: agenda.title,
              agendaId: agenda._id,
              participantId: registeredId,
              name: pName,
              email: pEmail,
              amount: body.gross_amount,
            }
          }).catch((e) => console.error("Failed to publish to QStash", e));
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
                    
                    // Garbage Collection: Cek apakah guest ini memiliki pendaftaran di agenda lain
                    const otherParticipationsCount = await ParticipantModel.countDocuments({ guest: participant.guest });
                    if (otherParticipationsCount === 0) {
                        const { GuestModel } = await import("~~/server/models/GuestModel");
                        await GuestModel.deleteOne({ _id: participant.guest });
                    }
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
