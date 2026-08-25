import { QuestionModel } from "~~/server/models/QuestionModel";
import { ensureCommitteeOrOrganizer } from "~~/server/utils/agendaAuth";

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
        const { id, questionId } = event.context.params as {
      id: string;
      questionId: string;
    };

    // Only committee/organizer of THIS agenda may modify its questionnaire.
    await ensureCommitteeOrOrganizer(id as string, user);
    const body = {
      value: "New Options",
    };
    const question = await QuestionModel.findByIdAndUpdate(
      questionId,
      { $push: { options: body } },
      { new: true }
    );

    if (!question) {
      throw createError({
        statusCode: 404,
        statusMessage: "Question not found",
      });
    }

    return {
      statusCode: 200,
      statusMessage: "Success",
      data: question,
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: error.message,
    };
  }
});
