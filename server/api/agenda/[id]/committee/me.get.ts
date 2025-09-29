import { AgendaModel } from "~~/server/models/AgendaModel";
import { ICommittee, IMember } from "~~/types";
import { ICommitteeResponse, IError } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<ICommitteeResponse | IError> => {
    try {
      const { id } = event.context.params as {
        id: string;
      };
      const user = event.context.user;
      const agenda = await AgendaModel.findById(id);
      if (!agenda) {
        return {
          statusCode: 404,
          statusMessage: "Agenda not found",
        };
      }
      let committee: ICommittee | undefined;
      if (user) {
        committee = agenda.committees?.find(
          (r) => (r.member as IMember | undefined)?.NIM === user.member.NIM
        );
      } else {
        // const ip =;
        // committee = agenda.committee?.find(
        //     (r) => r.guest?.ip === ip
        //     );
      }
      if (!committee) {
        return {
          statusCode: 404,
          statusMessage: "Committee not found",
        };
      }
      return {
        statusCode: 200,
        statusMessage: "Success",
        data: {
          committee: committee,
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
