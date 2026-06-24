import { AgendaModel } from "~~/server/models/AgendaModel";
import { verifySignature } from "~~/server/utils/midtrans";
import { himatikaPdfWorker } from "~~/server/utils/himatikaPdfWorker";
import { sendWhatsappFile } from "~~/server/utils/whatsapp";
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

          // E-Ticket via WhatsApp
          const pPhone = participantDoc.member?.phone || participantDoc.guest?.phone || "";
          if (pPhone) {
            // Run in background
            (async () => {
              try {
                const pdfBlob = await himatikaPdfWorker.generateTicket({
                  agenda: agenda as any,
                  participant: participantDoc as any,
                  amount: parseFloat(body.gross_amount) || 0,
                  role: isCommittee ? "committee" : "participant"
                });
                const arrayBuffer = await pdfBlob.arrayBuffer();
                const base64String = Buffer.from(arrayBuffer).toString('base64');
                const dataUri = `data:application/pdf;base64,${base64String}`;
                
                const filename = `Tiket-${isCommittee ? 'committee' : 'participant'}-${agenda.title.substring(0, 10)}-${pName.substring(0, 10)}.pdf`.replace(/\s/g, '_');
                
                const caption = `*[HIMATIKA - E-Ticket]*\n\nHalo!\nPembayaran Anda untuk acara *${agenda.title}* telah berhasil diverifikasi. 🎉\n\nBerikut kami lampirkan E-Ticket Anda (di atas pesan ini). Silakan tunjukkan dokumen E-Ticket ini saat registrasi ulang di lokasi acara.\n\nTerima kasih atas partisipasi Anda dan sampai jumpa di acara!`;

                await sendWhatsappFile(
                  pPhone,
                  dataUri,
                  filename,
                  "application/pdf",
                  caption
                );
              } catch (err) {
                console.error('[E-Ticket] Background WAHA send file error:', err);
              }
            })();
          }
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
                        await GuestModel.deleteOne({ _id: participant.guest as any });
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
