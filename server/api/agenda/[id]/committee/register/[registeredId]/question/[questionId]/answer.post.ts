import { AgendaModel } from "~~/server/models/AgendaModel";
import { AnswerModel } from "~~/server/models/AnswerModel";

export default defineEventHandler(async (event) => {
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
  const committee = agenda.committees?.find(
    (committee) => committee._id === registeredId
  );
  if (!committee) {
    throw createError({
      statusCode: 404,
      statusMessage: "Committee not found",
    });
  }
  let answerId: string | undefined = undefined;
  const answer = await AnswerModel.findOne({ answerer: committee._id });
  if (!answer) {
    const newAnswer = await AnswerModel.create({
      question: questionId,
      value: body.value,
      answerer: committee._id,
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
});
