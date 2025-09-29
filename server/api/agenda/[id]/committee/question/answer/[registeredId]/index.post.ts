import { AgendaModel } from "~~/server/models/AgendaModel";
import { AnswerModel } from "~~/server/models/AnswerModel";
import { IQuestion } from "~~/types";
import { IReqAnswer } from "~~/types/IRequestPost";

export default defineEventHandler(async (event) => {
  try {
    const { id, registeredId } = event.context.params as {
      id: string;
      registeredId: string;
    };
    const body = await readBody<IReqAnswer>(event);
    const agenda = await AgendaModel.findById(id);
    if (!agenda) {
      throw createError({
        statusCode: 404,
        statusMessage: "Agenda not found",
      });
    }
    const questions =
      (agenda.configuration.committee.questions as IQuestion[] | undefined) ||
      [];
    const answers = body.answers || [];
    if (!answers.length || answers.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Answer not found",
      });
    }
    if (
      answers.length < questions.filter((question) => question.required).length
    ) {
      throw createError({
        statusCode: 404,
        statusMessage: "Question not Answer for all required",
      });
    }

    if (!questions.length || questions.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Question not found",
      });
    }
    answers?.forEach(async (q) => {
      const questionId = q.questionId;
      const question = questions.find(
        (question) => question._id?.toString() === questionId
      );
      if (!question) {
        throw createError({
          statusCode: 404,
          statusMessage: "Question not found",
        });
      }
      // Handle multiple choice question
      if (question.type === "multiple") {
      }
      // Handle file type question
      if (question.type === "file") {
      }

      const answer = await AnswerModel.findOne({
        answerer: registeredId,
        question: questionId,
      });
      if (!answer) {
        const created = await AnswerModel.create({
          question: questionId,
          value: q.answer,
          answerer: registeredId,
        });
        if (!created) {
          throw createError({
            statusCode: 404,
            statusMessage: "Answer not created",
          });
        }
      } else {
        const updated = await AnswerModel.updateOne(
          { answerer: registeredId, question: questionId },
          { value: q.answer }
        );
        if (!updated) {
          throw createError({
            statusCode: 404,
            statusMessage: "Answer not updated",
          });
        }
      }
    });
    return {
      statusCode: 200,
      statusMessage: "Success",
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: error.message,
    };
  }
});
