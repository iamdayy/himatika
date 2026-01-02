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

    const agenda = await AgendaModel.findById(id);
    let fullName = "";
    if (!agenda) {
      return {
        statusCode: 404,
        statusMessage: "Agenda not found",
      };
    }
    const participant = agenda?.participants?.find(
      (r) => r._id?.toString() === registeredId
    );
    if (!participant) {
      return {
        statusCode: 404,
        statusMessage: "Participant not found",
      };
    }
    if (participant.guest) {
      fullName = participant.guest.fullName;
    } else if (participant.member) {
      fullName = (participant.member as IMember).fullName;
    }
    if (participant.member && user.member) {
      meIsParticipant = (participant.member as IMember).NIM === user.member.NIM;
    }
    const isCommittee = agenda.committees?.find(
      (c) => (c.member as IMember).NIM === user.member.NIM
    );
    if (!isCommittee && !meIsParticipant && !user.member.organizer) {
      return {
        statusCode: 401,
        statusMessage:
          "Cannot delete other's participant or yaourself when you are not committee or the organizer",
      };
    }
    agenda.participants = agenda.participants?.filter(
      (r) => r._id?.toString() !== registeredId
    );
    await agenda.save();
    return {
      statusCode: 200,
      statusMessage: "Success deleted " + fullName + " from participant",
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      statusMessage: error.statusMessage || error.message,
    };
  }
});
