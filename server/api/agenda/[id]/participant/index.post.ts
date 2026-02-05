import { AgendaModel } from "~~/server/models/AgendaModel";
import { IParticipant } from "~~/types";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }
    if (!user.member.organizer) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
      });
    }
    const { id } = event.context.params as { id: string };
    const body = await readBody<IParticipant>(event);

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing required parameters",
      });
    }

    const agenda = await AgendaModel.findById(id);

    if (!agenda) {
      throw createError({
        statusCode: 404,
        statusMessage: "Agenda not found",
      });
    }
    agenda.participants?.push({
      member: body.member,
    });
    await agenda.save();

    return {
      statusCode: 200,
      statusMessage: "Participant added successfully",
    };
  } catch (error) {
    console.error("Error adding participant:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
