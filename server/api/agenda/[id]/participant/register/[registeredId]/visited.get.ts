import { AgendaModel } from "~~/server/models/AgendaModel";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const user = event.context.user;
    if (!user) {
      return {
        statusCode: 401,
        statusMessage: "Unauthorized",
      };
    }
    const { id, registeredId } = event.context.params as {
      id: string;
      registeredId: string;
    };
    const agenda = await AgendaModel.findById(id);
    if (!agenda) {
      return {
        statusCode: 404,
        statusMessage: "Agenda not found",
      };
    }
    const participant = agenda?.participants?.find(
      (r) => r._id?.toString() === registeredId
    );
    if (!participant) {
      return {
        statusCode: 404,
        statusMessage: "Participant not found",
      };
    }

    participant.visiting = true;
    participant.visitTime = new Date();
    await agenda.save();
    return {
      statusCode: 200,
      statusMessage: "Success visited",
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      statusMessage: error.statusMessage || error.message,
    };
  }
});
