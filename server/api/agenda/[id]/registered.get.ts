import { AgendaModel } from "~~/server/models/AgendaModel";
import { IMember } from "~~/types";
import { IAgendaRegisteredResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IAgendaRegisteredResponse> => {
    try {
      const { id } = event.context.params as { id: string };
      const user = event.context.user;
      const agenda = await AgendaModel.findById(id);
      if (!agenda) {
        throw createError({
          statusCode: 404,
          statusMessage: "Agenda not found",
        });
      }

      const isRegisterd = agenda?.isRegisterd(user.member as IMember);
      if (!isRegisterd) {
        throw createError({
          statusCode: 403,
          statusMessage: "You are not registered for this agenda",
        });
      }
      return {
        statusCode: 200,
        statusMessage: "Successfully retrieved registration status",
        as:
          isRegisterd && typeof isRegisterd === "object" && "job" in isRegisterd
            ? "committee"
            : "participant",
        data: isRegisterd,
      };
    } catch (error: any) {
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || "Internal Server Error",
      });
    }
  }
);
