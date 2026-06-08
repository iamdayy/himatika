import { AgendaModel } from "~~/server/models/AgendaModel";
import { ParticipantModel } from "~~/server/models/ParticipantModel";
import { IMember, IParticipant } from "~~/types";
import { IError, IParticipantResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IParticipantResponse | IError> => {
    try {
      const { id } = event.context.params as {
        id: string;
      };
      const { participantId } = getQuery(event) as {
        participantId: string;
      };
      const user = event.context.user;
      const agenda = await AgendaModel.findById(id);
      if (!agenda) {
        return {
          statusCode: 404,
          statusMessage: "Agenda not found",
        };
      }
      let participant: any;
      if (user) {
        if (user.member) {
          const { MemberModel } = await import("~~/server/models/MemberModel");
          const member = await MemberModel.findOne({ NIM: user.member.NIM });
          if (member) {
            participant = await ParticipantModel.findOne({ agendaId: id, member: member._id });
          }
        } else if (user.guest) {
          participant = await ParticipantModel.findOne({ agendaId: id, guest: user.guest._id });
        }
      } else if (participantId) {
        participant = await ParticipantModel.findOne({ agendaId: id, _id: participantId });
      }

      if (!participant) {
        return {
          statusCode: 404,
          statusMessage: "Participant not found",
        };
      }
      return {
        statusCode: 200,
        statusMessage: "Success",
        data: {
          participant: participant,
        },
      };
    } catch (error: any) {
      return {
        statusCode: 500,
        statusMessage: error.statusMessage || error.message,
      };
    }
  }
);
