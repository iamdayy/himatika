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
    const { CommitteeModel } = await import("~~/server/models/CommitteeModel");
    const committees = await CommitteeModel.find({ _id: { $in: body.committees }, agendaId: agenda._id });
    
    const bulkOps = committees.map((committee) => {
      let updateDoc: any = {};
      if (body.field === "payment") {
        updateDoc = {
          "payment.status": "success",
          "payment.method": "cash",
          "payment.time": new Date()
        };
      } else if (body.field === "visiting") {
        const newVisiting = !committee.visiting;
        updateDoc = {
          visiting: newVisiting,
          visitTime: newVisiting ? new Date() : undefined
        };
      }
      return {
        updateOne: {
          filter: { _id: committee._id },
          update: { $set: updateDoc }
        }
      };
    });

    if (bulkOps.length > 0) {
      await CommitteeModel.bulkWrite(bulkOps);
    }
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
