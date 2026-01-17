import { AgendaModel } from "~~/server/models/AgendaModel";
import { AnswerModel } from "~~/server/models/AnswerModel";

export default defineEventHandler(async (event) => {
  try {
    const { id, registeredId, questionId } = event.context.params as {
      id: string;
      registeredId: string;
      questionId: string;
    };
    const body = await readBody(event);
    const agenda = await AgendaModel.findById(id);
    if (!agenda) {
      throw createError({
        statusCode: 404,
        statusMessage: "Agenda not found",
      });
    }
    const participant = agenda.participants?.find(
      (participant) => participant._id === registeredId
    );
    if (!participant) {
      throw createError({
        statusCode: 404,
        statusMessage: "Participant not found",
      });
    }
    let answerId: string | undefined = undefined;
    const answer = await AnswerModel.findOne({ answerer: participant._id });
    if (!answer) {
      const newAnswer = await AnswerModel.create({
        question: questionId,
        value: body.value,
        answerer: participant._id,
      });
      answerId = newAnswer.id;
    } else {
      answer.value = body.value;
      await answer.save();
      answerId = answer.id;
    }

    return {
      statusCode: 200,
      statusMessage: "Success",
      data: {
        id: answerId,
      },
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message,
    });
  }
});
