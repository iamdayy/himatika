import { AgendaModel } from "~~/server/models/AgendaModel";
import { CommitteeModel } from "~~/server/models/CommitteeModel";
import { AnswerModel } from "~~/server/models/AnswerModel";
import { IMember } from "~~/types";
import { IReqAgendaCommitteeQuery } from "~~/types/IRequestPost";
import { IAgendaCommitteeResponse } from "~~/types/IResponse";
import { ICommitteeSchema } from "~~/types/ISchemas";

export default defineEventHandler(
  async (event): Promise<IAgendaCommitteeResponse> => {
    try {
      const { perPage, page, search } =
        getQuery<IReqAgendaCommitteeQuery>(event);
      const { id } = event.context.params as {
        id: string;
      };
      const user = event.context.user;
      let showNotApproved = true;
      if (!user) {
        showNotApproved = false;
      }
      const agenda = await AgendaModel.findById(id).select("-configuration.participant -description").lean().exec();
      if (!agenda) {
        return {
          statusCode: 404,
          statusMessage: "Agenda not found",
        };
      }

      const allCommittees = await CommitteeModel.find({ agendaId: id })
        .populate("member", "fullName NIM email")
        .populate({
          path: "answers",
          model: AnswerModel,
          select: "question value",
        })
        .lean()
        .exec();

      // Check if the user is an approved committee member
      const isCommittee = allCommittees.some(
        (item) =>
          (item.member as IMember | undefined)?.NIM == user?.member.NIM &&
          item.approved === true
      );
      if (isCommittee) {
        showNotApproved = true;
      }

      let filteredCommittees = allCommittees;

      if (search) {
        const searchString = search.toLowerCase();
        filteredCommittees = allCommittees.filter((committee) => {
          const nameMember =
            (committee.member as IMember | undefined)?.fullName.toLowerCase() || "";
          const nimMember = (committee.member as IMember | undefined)?.NIM || 0;
          const emailMember =
            (committee.member as IMember | undefined)?.email?.toLowerCase() || "";
          return (
            nameMember.includes(searchString) ||
            nimMember.toString().includes(searchString) ||
            emailMember.includes(searchString)
          );
        });
      }

      if (!showNotApproved) {
          filteredCommittees = filteredCommittees.filter(c => c.approved === true);
      }

      const paginatedCommittees = filteredCommittees.slice((Number(page) - 1) * Number(perPage), Number(page) * Number(perPage));

      return {
        statusCode: 200,
        statusMessage: "Success",
        data: {
          agenda: agenda,
          committees: paginatedCommittees as any,
          length: filteredCommittees.length,
        },
      };
    } catch (error: any) {
      console.error("Error in get committee agenda:", error);
      return {
        statusCode: 500,
        statusMessage: error.statusMessage || error.message,
      };
    }
  }
);
