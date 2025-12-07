import { del, put } from "@vercel/blob";
import { AgendaModel } from "~~/server/models/AgendaModel";
import { AnswerModel } from "~~/server/models/AnswerModel";
import { IQuestion } from "~~/types";

export default defineEventHandler(async (event) => {
  try {
    const { id, registeredId } = event.context.params as {
      id: string;
      registeredId: string;
    };
    const multipart = await readMultipartFormData(event);

    const answersData = multipart?.find((p) => p.name === "answers");
    if (!answersData) {
      throw createError({
        statusCode: 400,
        statusMessage: "Answers data not provided",
      });
    }
    const answersFromBody: { questionId: string; answer: any }[] = JSON.parse(
      answersData.data.toString()
    );

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
    const answers = answersFromBody || [];
    if (!answers.length) {
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

    if (!questions.length) {
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

      // Handle file type
      if (question.type === "file" && q.answer === "[[FILE]]") {
        const filePart = multipart?.find((p) => p.name === questionId);
        const file = filePart;
        if (!file) {
          throw createError({
            statusCode: 404,
            statusMessage: `File for question ${question.question} not found`,
          });
        }

        const BASE_FILE_FOLDER = `/uploads/img/agenda/${agenda._id}/answers/${registeredId}`;
        const fileName = `${BASE_FILE_FOLDER}/${file.name}-${Date.now()}.${
          file.type
        }`;

        if (!file.type) {
          throw createError({
            statusCode: 400,
            statusMessage: `Invalid file type for question ${question.question}.`,
          });
        }
        if (q.answer) {
          await del(q.answer);
        }
        const { url } = await put(fileName, file.data, {
          access: "public",
        });
        q.answer = url;
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
      statusMessage: "Answers submitted successfully",
    };
  } catch (error: any) {
    console.error(error);
    return createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    });
  }
});
