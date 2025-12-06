import { AgendaModel } from "~~/server/models/AgendaModel";
import { IAgendaResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IAgendaResponse> => {
  try {
    const user = event.context.user;

    const now = new Date();
    // Cari agenda terdekat yang belum diikuti oleh user
    const nearestAgenda = await AgendaModel.findOne({
      "date.start": { $gte: now },
      $and: [
        {
          "participants.member": {
            $ne: user ? user.member._id : null,
          },
        },
        {
          "committees.member": {
            $ne: user ? user.member._id : null,
          },
        },
      ],
    }).sort({ "date.start": 1 });
    if (!nearestAgenda) {
      throw createError({
        statusCode: 404,
        statusMessage: "No upcoming agendas found",
      });
    }
    return {
      statusCode: 200,
      statusMessage: "Nearest agenda found",
      data: {
        agenda: nearestAgenda,
      },
    };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage:
        error.message ||
        "An unexpected error occurred while fetching nearest agenda",
    };
  }
});
