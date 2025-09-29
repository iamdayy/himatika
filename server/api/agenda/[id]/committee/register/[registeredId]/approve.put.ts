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
    const committee = agenda?.committees?.find(
      (r) => r._id?.toString() === registeredId
    );
    if (!committee) {
      return {
        statusCode: 404,
        statusMessage: "Committee not found",
      };
    }

    committee.approved = true;
    await agenda.save();
    return {
      statusCode: 200,
      statusMessage: "Success approved",
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      statusMessage: error.statusMessage || error.message,
    };
  }
});
