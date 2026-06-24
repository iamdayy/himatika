import { AgendaModel } from "~~/server/models/AgendaModel";
import { ensureCommitteeOrOrganizer } from "~~/server/utils/agendaAuth";
import { IPayReq } from "~~/types/IRequestPost";
import { IResponse } from "~~/types/IResponse";
import { himatikaPdfWorker } from "~~/server/utils/himatikaPdfWorker";
import { sendWhatsappFile } from "~~/server/utils/whatsapp";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const user = event.context.user;
    const { id, registeredId } = event.context.params as {
      id: string;
      registeredId: string;
    };
    const { paymentMethod } = await readBody<IPayReq>(event);

    const { ParticipantModel } = await import("~~/server/models/ParticipantModel");

    // Find the agenda by ID
    const agenda = await AgendaModel.findById(id);
    if (!agenda) {
      throw createError({
        statusCode: 404,
        statusMessage: "Agenda not found",
      });
    }

    // Only committee or organizer can manually mark payment
    await ensureCommitteeOrOrganizer(agenda._id.toString(), user);

    // Find the registered user by ID
    const participant = await ParticipantModel.findById(registeredId).populate("member").populate("guest");
    if (!participant || participant.agendaId.toString() !== id) {
      throw createError({
        statusCode: 404,
        statusMessage: "Participant user not found",
      });
    }
    if (!participant.payment) {
      throw createError({
        statusCode: 400,
        statusMessage: "Payment data not found",
      });
    }
    // Check if the payment method is valid
    // if (paymentMethod !== ) {
    //   throw createError({
    //     statusCode: 400,
    //     statusMessage: "Invalid payment method",
    //   });
    // }
    // Check if the payment method is already paid
    if (participant.payment.status === "success") {
      throw createError({
        statusCode: 400,
        statusMessage: "Payment already completed",
      });
    }
    participant.payment.status = "success";
    participant.payment.time = new Date();

    await participant.save();

    // Trigger payment-success email
    const { Client } = await import("@upstash/qstash");
    const qstashClient = new Client({ token: process.env.QSTASH_TOKEN || "" });
    const config = useRuntimeConfig();

    const customerName = participant.member ? (participant.member as any).fullName : (participant.guest as any)?.fullName || "";
    const customerEmail = participant.member ? (participant.member as any).email : (participant.guest as any)?.email || "";

    qstashClient.publishJSON({
      url: `${config.public.public_uri}/api/webhooks/qstash/email`,
      body: {
        type: "payment-success",
        agendaTitle: agenda.title,
        agendaId: agenda._id,
        participantId: registeredId,
        name: customerName,
        email: customerEmail,
        amount: participant.payment.amount || 0,
      },
    }).catch((e) => console.error("Failed to publish manual pay-success", e));

    // E-Ticket via WhatsApp
    const customerPhone = participant.member ? (participant.member as any).phone : (participant.guest as any)?.phone || "";
    if (customerPhone) {
      // Run in background
      (async () => {
        try {
          const pdfBlob = await himatikaPdfWorker.generateTicket({
            agenda: agenda as any,
            participant: participant as any,
            amount: participant.payment?.amount || 0,
            role: "participant"
          });
          const arrayBuffer = await pdfBlob.arrayBuffer();
          const base64String = Buffer.from(arrayBuffer).toString('base64');
          const dataUri = `data:application/pdf;base64,${base64String}`;
          
          let memberName = customerName;
          const filename = `Tiket-participant-${agenda.title.substring(0, 10)}-${memberName.substring(0, 10)}.pdf`.replace(/\s/g, '_');
          
          const caption = `*[HIMATIKA - E-Ticket]*\n\nHalo!\nPembayaran Anda untuk acara *${agenda.title}* telah berhasil diverifikasi. 🎉\n\nBerikut kami lampirkan E-Ticket Anda (di atas pesan ini). Silakan tunjukkan dokumen E-Ticket ini saat registrasi ulang di lokasi acara.\n\nTerima kasih atas partisipasi Anda dan sampai jumpa di acara!`;

          await sendWhatsappFile(
            customerPhone,
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

    return {
      statusCode: 200,
      statusMessage: "Payment marked as success",
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message,
    });
  }
});
