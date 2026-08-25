import { QuestionModel } from "~~/server/models/QuestionModel";
import { IQuestion } from "~~/types";
import { AgendaModel } from "~~/server/models/AgendaModel";
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
    const body = await readBody<IQuestion>(event);

    // Scope the global-looking update to questions owned by THIS agenda.
    const agendaDoc = await AgendaModel.findById(id);
    const ownedIds = (agendaDoc?.configuration.participant.questions ?? []) as Array<{ toString: () => string }>;
    if (!ownedIds.some((q) => q.toString() === questionId)) {
      throw createError({ statusCode: 404, statusMessage: "Question not found in this agenda" });
    }

    const question = await QuestionModel.findByIdAndUpdate(questionId, body, {
      new: true,
    });

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
