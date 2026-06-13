import { AgendaModel } from "~~/server/models/AgendaModel";
import { CommitteeModel } from "~~/server/models/CommitteeModel";
import { ParticipantModel } from "~~/server/models/ParticipantModel";
import { IPaymentVerificationResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IPaymentVerificationResponse> => {
  try {
    const { id } = event.context.params as { id: string };

    const agenda = await AgendaModel.findById(id);
    if (!agenda) {
      throw createError({ statusCode: 404, statusMessage: "Agenda not found" });
    }

    const participants = await ParticipantModel.find({
      agendaId: id,
      "payment.method": "manual_transfer",
      "payment.status": "verifying",
    }).populate("member").populate("guest");

    const committees = await CommitteeModel.find({
      agendaId: id,
      "payment.method": "manual_transfer",
      "payment.status": "verifying",
    }).populate("member");

    // Format list
    const results: any[] = [];
    
    participants.forEach(p => {
        results.push({
            _id: p._id,
            type: 'participant',
            name: p.member ? (p.member as any).fullName : (p.guest as any)?.fullName,
            email: p.member ? (p.member as any).email : (p.guest as any)?.email,
            payment: p.payment,
        });
    });

    committees.forEach(c => {
        results.push({
            _id: c._id,
            type: 'committee',
            name: c.member ? (c.member as any).fullName : '',
            email: c.member ? (c.member as any).email : '',
            payment: c.payment,
        });
    });

    return {
      statusCode: 200,
      statusMessage: "Verifying payments retrieved",
      data: {
        verifyingList: results,
        length: results.length,
      },
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    });
  }
});
