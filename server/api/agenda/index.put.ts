import { Types } from "mongoose";
import { AgendaModel } from "~~/server/models/AgendaModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { IAgenda, ICommittee, IQuestion } from "~~/types";
import { IError, IResponse } from "~~/types/IResponse";
/**
 * Handles PUT requests for updating an existing event.
 * @param {H3Event} ev - The H3 event object.
 * @returns {Promise<Object>} The result of the update operation.
 * @throws {H3Error} If an error occurs during the process.
 */
export default defineEventHandler(async (ev): Promise<IResponse | IError> => {
  try {
    // Ensure the user is authenticated and has the necessary permissions
    const user = ev.context.user;
    if (!user) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be logged in to use this endpoint",
      });
    }
    if (!ev.context.organizer) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be admin / departement to use this endpoint",
      });
    }

    // Get the agenda ID from the query parameters
    const { id } = getQuery(ev);

    // Read and validate the request body
    const body = await readBody<IAgenda>(ev);

    // Find the agenda by ID
    const agenda = await AgendaModel.findById(id);
    if (!agenda) {
      throw createError({
        statusCode: 404,
        statusMessage: "The agenda is not found",
      });
    }
    let committees: ICommittee[] | undefined = undefined;
    if (body.committees) {
      // Process committee members
      committees = await Promise.all(
        body.committees?.map(async (committee) => {
          try {
            const member = await MemberModel.findOne({ NIM: Number(committee.member) });
            if (!member) {
              return {
                job: committee.job,
                member: undefined,
                approved: false,
                approvedAt: undefined,
              };
            }
            return {
              job: committee.job,
              member: member._id as any,
              approved: committee.approved,
              approvedAt: committee.approvedAt,
            };
          } catch (error: any) {
            throw createError({
              statusCode: error.statusCode,
              message: error.message,
              data: error.data,
            });
          }
        })
      );
    }
    body.configuration.participant.questions = (
      agenda.configuration.participant.questions as IQuestion[]
    ).map((question) => question._id as Types.ObjectId);
    body.configuration.committee.questions = (
      agenda.configuration.committee.questions as IQuestion[]
    ).map((question) => question._id as Types.ObjectId);
    const saved = await agenda.updateOne({
      title: body.title,
      description: body.description,
      date: body.date,
      at: body.at,
      category: body.category,
      configuration: body.configuration,
      committees: committees,
    });
    if (!saved) {
      throw createError({
        statusCode: 400,
        statusMessage: "Failed to update the agenda",
      });
    }
    // Update the agenda with the new data
    // Return success response
    return {
      statusCode: 200,
      statusMessage: `Agenda ${agenda.title} updated`,
      data: agenda._id,
    };
  } catch (error: any) {
    // Handle any errors that occur during the process
    return {
      statusCode: error.statusCode || 500,
      statusMessage:
        error.message ||
        "An unexpected error occurred while updating the agenda",
      data: error.data,
    };
  }
});
