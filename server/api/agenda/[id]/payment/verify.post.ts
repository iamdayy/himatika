import { AgendaModel } from "~~/server/models/AgendaModel";
import { CommitteeModel } from "~~/server/models/CommitteeModel";
import { ParticipantModel } from "~~/server/models/ParticipantModel";
import { himatikaPdfWorker } from "~~/server/utils/himatikaPdfWorker";
import { sendWhatsappFile } from "~~/server/utils/whatsapp";

export default defineEventHandler(async (event) => {
  try {
    const { id } = event.context.params as { id: string };
    const body = await readBody<{ registeredId: string, status: 'success' | 'failed' }>(event);

    if (!body.registeredId || !['success', 'failed'].includes(body.status)) {
      throw createError({ statusCode: 400, statusMessage: "Invalid request body" });
    }

    const agenda = await AgendaModel.findById(id);
    if (!agenda) {
      throw createError({ statusCode: 404, statusMessage: "Agenda not found" });
    }

    let registration = await ParticipantModel.findById(body.registeredId).populate("member").populate("guest");
    let isCommittee = false;

    if (!registration) {
      registration = await CommitteeModel.findById(body.registeredId).populate("member") as any;
      isCommittee = true;
    }

    if (!registration) {
      throw createError({ statusCode: 404, statusMessage: "Registration not found" });
    }

    if (!registration.payment || registration.payment.method !== "manual_transfer") {
      throw createError({ statusCode: 400, statusMessage: "This registration does not use manual transfer" });
    }

    registration.payment = {
      ...registration.payment,
      status: body.status,
    } as any;

    await registration.save();

    if (body.status === 'success') {
      const { Client } = await import("@upstash/qstash");
      const qstashClient = new Client({ token: process.env.QSTASH_TOKEN || "" });
      const config = useRuntimeConfig();

      const customerName = registration.member ? (registration.member as any).fullName : (registration.guest as any)?.fullName || "";
      const customerEmail = registration.member ? (registration.member as any).email : (registration.guest as any)?.email || "";

      qstashClient.publishJSON({
        url: `${config.public.public_uri}/api/webhooks/qstash/email`,
        body: {
          type: "payment-success",
          agendaTitle: agenda.title,
          agendaId: agenda._id,
          participantId: body.registeredId,
          name: customerName,
          email: customerEmail,
          amount: registration.payment?.amount,
        },
      }).catch((e) => console.error("Failed to publish manual payment-success", e));

      // E-Ticket via WhatsApp
      const customerPhone = registration.member ? (registration.member as any).phone : (registration.guest as any)?.phone || "";
      if (customerPhone) {
        // Run in background
        (async () => {
          try {
            const pdfBlob = await himatikaPdfWorker.generateTicket({
              agenda: agenda as any,
              participant: registration as any,
              amount: registration.payment?.amount || 0,
              role: isCommittee ? "committee" : "participant"
            });
            const arrayBuffer = await pdfBlob.arrayBuffer();
            const base64String = Buffer.from(arrayBuffer).toString('base64');
            const dataUri = `data:application/pdf;base64,${base64String}`;
            
            let memberName = customerName;
            const filename = `Tiket-${isCommittee ? 'committee' : 'participant'}-${agenda.title.substring(0, 10)}-${memberName.substring(0, 10)}.pdf`.replace(/\s/g, '_');
            
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
    }

    return {
      statusCode: 200,
      statusMessage: "Payment verified successfully",
      data: { payment: registration.payment },
    };
  } catch (error: any) {
    console.error(error);
    return createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    });
  }
});
