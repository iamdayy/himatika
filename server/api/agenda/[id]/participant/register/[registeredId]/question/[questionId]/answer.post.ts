import { AgendaModel } from "~~/server/models/AgendaModel";
import { AnswerModel } from "~~/server/models/AnswerModel";
import { ParticipantModel } from "~~/server/models/ParticipantModel";

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
    const participant = await ParticipantModel.findById(registeredId);
    if (!participant || String(participant.agendaId) !== id) {
      throw createError({
        statusCode: 404,
        statusMessage: "Participant not found",
      });
    }

    // Scope the answer to THIS agenda's questionnaire and the exact question
    // — previously findOne({answerer}) without a question filter made Q2
    // overwrite Q1 whenever a single answer row existed.
    const questions = (agenda.configuration.participant.questions ?? []) as Array<{
      toString: () => string;
    }>;
    if (!questions.some((q) => q.toString() === questionId)) {
      throw createError({
        statusCode: 404,
        statusMessage: "Question not found in this agenda",
      });
    }
    let answerId: string | undefined = undefined;
    const answer = await AnswerModel.findOne({
      answerer: participant._id,
      question: questionId,
    });
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
