import { AgendaModel } from "~~/server/models/AgendaModel";
import { ParticipantModel } from "~~/server/models/ParticipantModel";

export default defineEventHandler(async (event) => {
  try {
    const { id, participantId } = event.context.params as {
      id: string;
      participantId: string;
    };

    const agenda = await AgendaModel.findById(id).lean();
    if (!agenda) {
      throw createError({ statusCode: 404, statusMessage: "Agenda not found" });
    }

    const participant = await ParticipantModel.findOne({ agendaId: id, _id: participantId }).lean();
    if (!participant) {
      throw createError({ statusCode: 404, statusMessage: "Participant not found" });
    }

    // Check payment status if required
    const agendaConfig = agenda.configuration?.participant;
    const isPaymentRequired = agendaConfig?.pay;
    const isPaid = !isPaymentRequired || participant.payment?.status === 'success';

    if (!isPaid) {
      throw createError({ statusCode: 403, statusMessage: "Selesaikan pembayaran terlebih dahulu" });
    }

    // Resolve ticket model
    const ticketModels = agendaConfig?.ticketModels || [];
    const myTicketModel = ticketModels.find((m: any) => (m._id?.toString() || m.name) === participant.ticketModelId);

    if (!myTicketModel) {
      throw createError({ statusCode: 404, statusMessage: "Model tiket tidak ditemukan" });
    }

    if (!myTicketModel.meetLink) {
      throw createError({ statusCode: 400, statusMessage: "Tiket ini tidak memiliki akses pertemuan daring" });
    }

    // Pengecekan Waktu (Akses dibuka 30 menit sebelum acara)
    const agendaStartTime = new Date(agenda.date.start).getTime();
    const now = new Date().getTime();
    // 30 menit dalam milidetik
    const threshold = 30 * 60 * 1000;

    if (now < agendaStartTime - threshold) {
      throw createError({ statusCode: 403, statusMessage: "Akses Zoom baru akan dibuka 30 menit sebelum acara dimulai" });
    }

    // Redirect ke Zoom
    return sendRedirect(event, myTicketModel.meetLink, 302);
  } catch (error: any) {
    // Return HTML error page or standard error depending on Nuxt
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    });
  }
});
