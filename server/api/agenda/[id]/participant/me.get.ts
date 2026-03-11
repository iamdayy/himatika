import { AgendaModel } from "~~/server/models/AgendaModel";
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
      let participant: IParticipant | undefined;
      if (user) {
        if (user.member) {
          participant = agenda.participants?.find(
            (r) => (r.member as IMember)?.NIM === user.member.NIM
          );
        } else if (user.guest) {
           participant = agenda.participants?.find(
            (r) => (r.guest as any)?._id?.toString() === user.guest._id.toString() || (r.guest as any)?.toString() === user.guest._id.toString()
          );
        }
      } else if (participantId) {
        participant = agenda.participants?.find(
          (r) => r._id?.toString() === participantId
        );
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
