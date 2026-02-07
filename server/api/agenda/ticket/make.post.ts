import { IAgenda, ICommittee, IParticipant } from "~~/types";

export default defineEventHandler(async (event) => {
  const { user } = event.context;
  // Ticket generation might be public or protected? Usually protected for the user or committee.
  // But let's check useMakeDocs.ts usage. It seems used in `Agenda` context.
  
  const body = await readBody(event);
  const agenda = body.agenda as IAgenda;
  const participant = body.participant as IParticipant | ICommittee;
  const amount = body.amount as number;
  const role = body.role as "participant" | "committee";

  if (!agenda || !participant) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing agenda or participant data",
    });
  }

  try {
    const pdfBlob = await himatikaPdfWorker.generateTicket({
      agenda,
      participant,
      amount,
      role
    });

    // Determine filename
    let memberName = 'Peserta';
    const member = participant.member as any;
    if (member && member.fullName) {
      memberName = member.fullName;
    } else if ((participant as any).guest && (participant as any).guest.fullName) {
      memberName = (participant as any).guest.fullName;
    }
    
    const filename = `Tiket-${role}-${agenda.title.substring(0, 10)}-${memberName.substring(0, 10)}.pdf`.replace(/\s/g, '_');

    setResponseHeaders(event, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`
    });

    return pdfBlob;

  } catch (error: any) {
    console.error("Ticket Generation Error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to generate ticket",
    });
  }
});
