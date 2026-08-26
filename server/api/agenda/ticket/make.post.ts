import { AgendaModel } from "~~/server/models/AgendaModel";
import { ParticipantModel } from "~~/server/models/ParticipantModel";
import { CommitteeModel } from "~~/server/models/CommitteeModel";
import {
  ensureCommitteeOrOrganizer,
  userOwnsRegistration,
} from "~~/server/utils/agendaAuth";

/**
 * Generates an e-ticket PDF. Entities are loaded from the database by id —
 * the previous implementation rendered whatever agenda/participant/amount
 * the client posted, letting anyone mint realistic forged tickets (and feed
 * arbitrary templateUrls to the PDF worker).
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id: agendaId, registeredId, role } = body as {
    id?: string;
    registeredId?: string;
    role?: "participant" | "committee";
  };

  if (!agendaId || !registeredId || !role) {
    throw createError({
      statusCode: 400,
      statusMessage: "agendaId, registeredId, and role are required",
    });
  }

  try {
    const user = event.context.user;
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const agenda = await AgendaModel.findById(agendaId);
    if (!agenda) {
      throw createError({ statusCode: 404, statusMessage: "Agenda not found" });
    }

    let registration: any;
    if (role === "committee") {
      registration = await CommitteeModel.findById(registeredId).populate("member");
    } else {
      registration = await ParticipantModel.findById(registeredId)
        .populate("member")
        .populate("guest");
    }
    if (!registration || String(registration.agendaId) !== agendaId) {
      throw createError({
        statusCode: 404,
        statusMessage: "Registration not found",
      });
    }

    // Only the registrant or committee/organizer may print this ticket.
    const isOwner = await userOwnsRegistration(user, registration);
    if (!isOwner) {
      await ensureCommitteeOrOrganizer(agenda._id.toString(), user);
    }

    // Derive amount from configuration / selected ticket model — never from
    // client input.
    let amount = 0;
    if (role === "committee") {
      amount = agenda.configuration?.committee?.amount ?? 0;
    } else {
      amount = agenda.configuration?.participant?.amount ?? 0;
      const ticketModelId = registration.ticketModelId;
      if (ticketModelId) {
        const model = (agenda.configuration?.participant?.ticketModels ?? []).find(
          (m: any) => m._id?.toString() === String(ticketModelId)
        );
        if (model) amount = model.price;
      }
    }

    const pdfBlob = await himatikaPdfWorker.generateTicket({
      agenda: agenda as any,
      participant: registration,
      amount,
      role,
    });

    const member = registration.member as any;
    const guest = registration.guest as any;
    const memberName =
      member?.fullName || guest?.fullName || "Peserta";
    const filename = `Tiket-${role}-${agenda.title.substring(0, 10)}-${memberName.substring(0, 10)}.pdf`.replace(/\s/g, "_");

    setResponseHeaders(event, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    });

    return pdfBlob;
  } catch (error: any) {
    console.error("Ticket Generation Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to generate ticket",
    });
  }
});
