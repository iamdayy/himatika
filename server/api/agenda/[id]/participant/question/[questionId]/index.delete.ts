import { AgendaModel } from "~~/server/models/AgendaModel";
export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }
    const { id, questionId } = event.context.params as {
      id: string;
      questionId: string;
    };
    const agenda = await AgendaModel.findByIdAndUpdate(
      id,
      { $pull: { "configuration.participant.questions": questionId } }, // Remove question from agenda
      { new: true }
    );
    if (!agenda) {
      throw createError({
        statusCode: 404,
        statusMessage: "Agenda not found",
      });
    }
    // const question = await QuestionModel.findByIdAndDelete(questionId);
    // if (!question) {
    //   throw createError({
    //     statusCode: 404,
    //     statusMessage: "Question not found",
    //   });
    // }
    return {
      statusCode: 200,
      statusMessage: "Success",
      // data: question,
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: error.message,
    };
  }
});
