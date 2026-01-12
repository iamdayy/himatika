import { AgendaModel } from "~~/server/models/AgendaModel";
import { AnswerModel } from "~~/server/models/AnswerModel";
import { IGuest, IMember } from "~~/types";
import { IReqAgendaParticipantQuery } from "~~/types/IRequestPost";
import { IAgendaParticipantResponse } from "~~/types/IResponse";
import { IParticipantSchema } from "~~/types/ISchemas";

export default defineEventHandler(
  async (event): Promise<IAgendaParticipantResponse> => {
    try {
      const { perPage, page, search } =
        getQuery<IReqAgendaParticipantQuery>(event);
      const { id } = event.context.params as {
        id: string;
      };
      const agenda = await AgendaModel.findById(id).populate({
        path: "participants",
        populate: [
          {
            path: "answers",
            model: AnswerModel,
            select: "question value",
          },
          {
            path: "member",
            model: "Member",
            select: "fullName email NIM semester",
          },
        ],
      });
      if (!agenda) {
        return {
          statusCode: 404,
          statusMessage: "Agenda not found",
        };
      }
      const participants =
        (agenda.participants as IParticipantSchema[])
          ?.map((participant: IParticipantSchema) => {
            return {
              ...participant.toObject(),
              answers: participant.answers,
            };
          })
          ?.slice(
            (Number(page) - 1) * Number(perPage),
            Number(perPage) * Number(page)
          )
          .filter((participant) => {
            if (search) {
              const searchString = search.toLowerCase();
              const nameMember =
                (participant.member as IMember)?.fullName.toLowerCase() || "";
              const nimMember = (participant.member as IMember)?.NIM || 0;
              const emailMember =
                (participant.member as IMember)?.email?.toLowerCase() || "";
              const nameGuest =
                (participant.guest as IGuest)?.fullName.toLowerCase() || "";
              const emailGuest =
                (participant.guest as IGuest)?.email?.toLowerCase() || "";
              return (
                nameMember.includes(searchString) ||
                nimMember.toString().includes(searchString) ||
                emailMember.includes(searchString) ||
                nameGuest.includes(searchString) ||
                emailGuest.includes(searchString)
              );
            }
            return true;
          }) || [];
      return {
        statusCode: 200,
        statusMessage: "Success",
        data: {
          agenda: agenda.toObject(),
          participants: participants,
          length: agenda.participants?.length || 0,
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
