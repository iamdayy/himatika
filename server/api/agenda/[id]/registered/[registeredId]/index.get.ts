import { AgendaModel } from "~~/server/models/AgendaModel";
import { IAgendaRegisteredResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IAgendaRegisteredResponse> => {
    try {
      const { id, registeredId } = event.context.params as {
        id: string;
        registeredId: string;
      };
      const user = event.context.user;
      const organizer = event.context.organizer;
      const agenda = await AgendaModel.findById(id);
      if (!agenda) {
        throw createError({
          statusCode: 404,
          statusMessage: "Agenda not found",
        });
      }
      if (!organizer) {
        throw createError({
          statusCode: 401,
          statusMessage: "Unauthorized access",
        });
      }
      const isRegisterd = agenda?.isRegisterdById(registeredId);
      if (!isRegisterd) {
        throw createError({
          statusCode: 403,
          statusMessage: "Registration not found for this agenda",
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
