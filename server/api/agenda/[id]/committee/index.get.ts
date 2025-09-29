import { AgendaModel } from "~~/server/models/AgendaModel";
import { IMember } from "~~/types";
import { IReqAgendaCommitteeQuery } from "~~/types/IRequestPost";
import { IAgendaCommitteeResponse } from "~~/types/IResponse";

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
      const agenda = await AgendaModel.findById(id);
      if (!agenda) {
        return {
          statusCode: 404,
          statusMessage: "Agenda not found",
        };
      }
      if (!agenda.committees) {
        return {
          statusCode: 404,
          statusMessage: "Committees not found",
        };
      }
      // Check if the user is a committee member
      const isCommittee = agenda.committees?.some(
        (item) =>
          (item.member as IMember | undefined)?.NIM == user?.member.NIM &&
          item.approved === true
      );
      if (isCommittee) {
        showNotApproved = true;
      }
      const committees =
        agenda.committees
          ?.slice(
            (Number(page) - 1) * Number(perPage),
            Number(perPage) * Number(page)
          )
          .filter((committee) => {
            if (search) {
              const searchString = search.toLowerCase();
              const nameMember =
                (
                  committee.member as IMember | undefined
                )?.fullName.toLowerCase() || "";
              const nimMember =
                (committee.member as IMember | undefined)?.NIM || 0;
              const emailMember =
                (
                  committee.member as IMember | undefined
                )?.email?.toLowerCase() || "";
              return (
                nameMember.includes(searchString) ||
                nimMember.toString().includes(searchString) ||
                emailMember.includes(searchString)
              );
            }
            return true;
          })
          .filter((Committee) => {
            if (showNotApproved) {
              return true;
            } else {
              return Committee.approved == true;
            }
          }) || [];
      return {
        statusCode: 200,
        statusMessage: "Success",
        data: {
          agenda: agenda.toObject(),
          committees: committees,
          length: committees?.length || 0,
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
