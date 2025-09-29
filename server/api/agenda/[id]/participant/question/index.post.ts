import { Types } from "mongoose";
import { AgendaModel } from "~~/server/models/AgendaModel";
import { QuestionModel } from "~~/server/models/QuestionModel";
import { IQuestion } from "~~/types";

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }
    const { id } = event.context.params as { id: string };
    const body: IQuestion = {
      question: "New Question",
      type: "text",
      options: [],
      required: false,
    };
    const agenda = await AgendaModel.findById(id);
    if (!agenda) {
      throw createError({
        statusCode: 404,
        statusMessage: "Agenda not found",
      });
    }
    const question = await QuestionModel.create(body);
    (agenda.configuration.participant.questions as Types.ObjectId[])?.push(
      question._id as Types.ObjectId
    );
    await agenda.save();
    return {
      statusCode: 200,
      statusMessage: "Success",
      data: {
        id: question.id,
      },
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: error.message,
    };
  }
});
