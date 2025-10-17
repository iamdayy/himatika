import { AgendaModel } from "~~/server/models/AgendaModel";
import { IReqCommitteeBatch } from "~~/types/IRequestPost";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const user = event.context.user;
    const organizer = event.context.organizer;
    if (!user && !organizer) {
      return {
        statusCode: 401,
        statusMessage: "Unauthorized",
      };
    }
    const { id } = event.context.params as { id: string };
    const body = await readBody<IReqCommitteeBatch>(event);
    if (!body || !body.committees || !body.field) {
      return {
        statusCode: 400,
        statusMessage: "Invalid request body",
      };
    }
    const agenda = await AgendaModel.findById(id);
    if (!agenda) {
      return {
        statusCode: 404,
        statusMessage: "Agenda not found",
      };
    }
    const updatedCommittees = agenda.committees?.map((committee) => {
      if (body.committees.includes(committee._id?.toString() || "")) {
        if (body.field === "payment") {
          if (committee.payment) {
            committee.payment.status = "success";
          }
        } else if (body.field === "visiting") {
          committee.visiting = !committee.visiting;
          committee.visitTime = committee.visiting ? new Date() : undefined;
        }
      }
      return committee;
    });
    agenda.committees = updatedCommittees;
    await agenda.save();
    return {
      statusCode: 200,
      statusMessage: "Committees updated successfully",
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      statusMessage: error.statusMessage || error.message,
    };
  }
});
