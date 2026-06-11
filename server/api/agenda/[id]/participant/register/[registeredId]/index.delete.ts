import { AgendaModel } from "~~/server/models/AgendaModel";
import { IMember } from "~~/types";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const { id, registeredId } = event.context.params as {
      id: string;
      registeredId: string;
    };
    let meIsParticipant = false;
    const user = event.context.user;
    if (!user) {
      return {
        statusCode: 401,
        statusMessage: "Unauthorized",
      };
    }

    const { ParticipantModel } = await import("~~/server/models/ParticipantModel");
    const { CommitteeModel } = await import("~~/server/models/CommitteeModel");

    const agenda = await AgendaModel.findById(id);
    let fullName = "";
    if (!agenda) {
      return {
        statusCode: 404,
        statusMessage: "Agenda not found",
      };
    }
    
    const participant = await ParticipantModel.findById(registeredId).populate("member").populate("guest");
    if (!participant || participant.agendaId.toString() !== id) {
      return {
        statusCode: 404,
        statusMessage: "Participant not found",
      };
    }

    if (participant.guest) {
      fullName = (participant.guest as any).fullName;
    } else if (participant.member) {
      fullName = (participant.member as IMember).fullName;
    }

    if (participant.member && user.member) {
      meIsParticipant = (participant.member as IMember).NIM === user.member.NIM;
    }

    const isCommittee = await CommitteeModel.exists({
      agendaId: id,
      member: user.member?._id
    });

    if (!isCommittee && !meIsParticipant && !user.member?.organizer) {
      return {
        statusCode: 401,
        statusMessage:
          "Cannot delete other's participant or yourself when you are not committee or the organizer",
      };
    }
    
    await ParticipantModel.findByIdAndDelete(registeredId);
    
    return {
      statusCode: 200,
      statusMessage: "Success deleted " + fullName + " from participant",
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message,
    });
  }
});
