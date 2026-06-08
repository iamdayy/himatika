import { AgendaModel } from "~~/server/models/AgendaModel";
import { ParticipantModel } from "~~/server/models/ParticipantModel";
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
      
      const agenda = await AgendaModel.findById(id).select("-configuration.committee -description").exec();
      if (!agenda) {
        return {
          statusCode: 404,
          statusMessage: "Agenda not found",
        };
      }

      const allParticipants = await ParticipantModel.find({ agendaId: id })
        .populate("member", "fullName NIM email")
        .populate("guest", "fullName email")
        .populate({
          path: "answers",
          model: AnswerModel,
          select: "question value",
        })
        .exec();

      let filteredParticipants = allParticipants;
      
      if (search) {
        const searchString = search.toLowerCase();
        filteredParticipants = allParticipants.filter((participant) => {
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
        });
      }

      const paginatedParticipants = filteredParticipants
        .slice((Number(page) - 1) * Number(perPage), Number(page) * Number(perPage))
        .map(p => p.toObject());

      return {
        statusCode: 200,
        statusMessage: "Success",
        data: {
          agenda: agenda.toObject(),
          participants: paginatedParticipants as any,
          length: filteredParticipants.length,
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
