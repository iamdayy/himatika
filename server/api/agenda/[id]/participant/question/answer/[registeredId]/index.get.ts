import { AgendaModel } from "~~/server/models/AgendaModel";
import { AnswerModel } from "~~/server/models/AnswerModel";
import { IQuestion } from "~~/types";
import { IAnswersResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IAnswersResponse> => {
  try {
    const { id, registeredId } = event.context.params as {
      id: string;
      registeredId: string;
    };
    const agenda = await AgendaModel.findById(id);
    if (!agenda) {
      throw createError({
        statusCode: 404,
        statusMessage: "Agenda not found",
      });
    }
    const questions =
      (agenda.configuration.participant.questions as IQuestion[] | undefined) ||
      [];
    const answers = await AnswerModel.find({
      answerer: registeredId,
    });
    // if (!answers || answers.length === 0) {
    //   throw createError({
    //     statusCode: 404,
    //     statusMessage: "Answer not found",
    //   });
    // }
    const questionsAnswered = questions?.map(async (question) => {
      const questionId = question._id?.toString();
      const answer = answers?.find(
        (ans) => ans.question._id?.toString() === questionId
      );
      // if (!answer) {
      //   throw createError({
      //     statusCode: 404,
      //     statusMessage: "Answer not found",
      //   });
      // }
      const questionAnswer = {
        question: question,
        answer: answer?.value,
      };
      return questionAnswer;
    });
    const result = await Promise.all(questionsAnswered);
    if (!result || result.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Answer not found",
      });
    }
    return {
      statusCode: 200,
      statusMessage: "Success",
      data: {
        answers: result,
      },
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
