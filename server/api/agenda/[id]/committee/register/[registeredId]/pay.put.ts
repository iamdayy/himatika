import { AgendaModel } from "~~/server/models/AgendaModel";
import { ensureCommitteeOrOrganizer } from "~~/server/utils/agendaAuth";
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

    const { CommitteeModel } = await import("~~/server/models/CommitteeModel");

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
    const committee = await CommitteeModel.findById(registeredId).populate("member");
    if (!committee || committee.agendaId.toString() !== id) {
      throw createError({
        statusCode: 404,
        statusMessage: "Committee user not found",
      });
    }

    if (!committee.payment) {
      throw createError({
        statusCode: 400,
        statusMessage: "Payment data not found",
      });
    }

    // Check if the payment method is already paid
    if (committee.payment.status === "success") {
      throw createError({
        statusCode: 400,
        statusMessage: "Payment already completed",
      });
    }
    committee.payment.status = "success";
    committee.payment.method = "cash";
    committee.payment.time = new Date();

    await committee.save();

    // E-Ticket via WhatsApp
    const customerPhone = committee.member ? (committee.member as any).phone : "";
    if (customerPhone) {
      // Run in background
      (async () => {
        try {
          const pdfBlob = await himatikaPdfWorker.generateTicket({
            agenda: agenda as any,
            participant: committee as any,
            amount: committee.payment?.amount || 0,
            role: "committee"
          });
          const arrayBuffer = await pdfBlob.arrayBuffer();
          const base64String = Buffer.from(arrayBuffer).toString('base64');
          const dataUri = `data:application/pdf;base64,${base64String}`;
          
          let memberName = committee.member ? (committee.member as any).fullName : "Panitia";
          const filename = `Tiket-committee-${agenda.title.substring(0, 10)}-${memberName.substring(0, 10)}.pdf`.replace(/\s/g, '_');
          
          const caption = `*[HIMATIKA - E-Ticket]*\n\nHalo!\nPembayaran Anda untuk kepanitiaan acara *${agenda.title}* telah berhasil diverifikasi secara tunai. 🎉\n\nBerikut kami lampirkan E-Ticket Anda (di atas pesan ini). Silakan tunjukkan dokumen E-Ticket ini saat registrasi ulang di lokasi acara.\n\nTerima kasih atas partisipasi Anda dan sampai jumpa di acara!`;

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
