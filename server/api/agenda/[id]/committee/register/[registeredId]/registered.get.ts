import { AgendaModel } from "~~/server/models/AgendaModel";
import { IMember } from "~~/types";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IResponse & { data?: string }> => {
    try {
      const { id, registeredId } = event.context.params as {
        id: string;
        registeredId: string;
      };
      const agenda = await AgendaModel.findById(id);
      let fullName = "";
      if (!agenda) {
        return {
          statusCode: 404,
          statusMessage: "Agenda not found",
        };
      }
      const registered = agenda?.committees?.find(
        (r) => r._id?.toString() === registeredId
      );
      if (!registered) {
        return {
          statusCode: 404,
          statusMessage: "Registered not found",
        };
      }
      if (registered.member) {
        fullName = (registered.member as IMember).fullName;
      }
      return {
        statusCode: 200,
        statusMessage: "Success visited",
        data: fullName,
      };
    } catch (error: any) {
      return {
        statusCode: 500,
        statusMessage: error.statusMessage || error.message,
      };
    }
  }
);
