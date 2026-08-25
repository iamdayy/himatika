import { uploadToR2, StoragePaths } from "~~/server/utils/storage";
import {
  ensureCommitteeOrOrganizer,
  userOwnsRegistration,
} from "~~/server/utils/agendaAuth";
import { AgendaModel } from "~~/server/models/AgendaModel";
import { ParticipantModel } from "~~/server/models/ParticipantModel";
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
    // Ownership: members answer only their own registration; anonymous
    // callers must target a guest registration (capability = link id).
    const registration = await ParticipantModel.findById(registeredId).select("_id guest member agendaId");
    if (!registration || String(registration.agendaId) !== id) {
      throw createError({ statusCode: 404, statusMessage: "Registration not found" });
    }
    const isOwner = await userOwnsRegistration(event.context.user, registration);
    if (!isOwner) {
      const anonymousGuestCapability =
        !event.context.user && !!registration.guest;
      if (!anonymousGuestCapability) {
        await ensureCommitteeOrOrganizer(id, event.context.user);
      }
    }

    const questions =
      (agenda.configuration.participant.questions as IQuestion[] | undefined) ||
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
    for (const q of answers) {
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

        const fileObj = {
          name: file.name || `${questionId}.${file.type?.split('/')[1] || 'bin'}`,
          data: file.data,
          type: file.type
        };

        if (!file.type) {
          throw createError({
            statusCode: 400,
            statusMessage: `Invalid file type for question ${question.question}.`,
          });
        }
        
        q.answer = await uploadToR2(fileObj, StoragePaths.AGENDAS(agenda._id.toString(), 'answers', registeredId));
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
    }
    return {
      statusCode: 200,
      statusMessage: "Answers submitted successfully",
    };
  } catch (error: any) {
    console.error(error);
    // Throw real HTTP errors — previously failures were returned as bodies
    // under HTTP 200 (or swallowed by the async forEach entirely).
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || "Internal Server Error",
    });
  }
});
