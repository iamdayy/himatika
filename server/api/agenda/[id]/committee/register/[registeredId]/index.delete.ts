import { AgendaModel } from "~~/server/models/AgendaModel";
import { IMember } from "~~/types";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const { id, registeredId } = event.context.params as {
      id: string;
      registeredId: string;
    };
    let meIsCommittee = false;
    const user = event.context.user;
    const organizer = event.context.organizer;
    if (!user && !organizer) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    const { CommitteeModel } = await import("~~/server/models/CommitteeModel");
    
    const agenda = await AgendaModel.findById(id);
    let fullName = "";
    if (!agenda) {
      throw createError({
        statusCode: 404,
        statusMessage: "Agenda not found",
      });
    }

    const committee = await CommitteeModel.findById(registeredId).populate("member");
    if (!committee || committee.agendaId.toString() !== id) {
      throw createError({
        statusCode: 404,
        statusMessage: "Committee not found",
      });
    }

    if (committee.member) {
      fullName = (committee.member as IMember).fullName;
    } else {
      await CommitteeModel.findByIdAndDelete(registeredId);
      return {
        statusCode: 200,
        statusMessage: "Success deleted committee with no member",
      };
    }
    
    if (committee.member && user.member) {
      meIsCommittee = (committee.member as IMember).NIM === user.member.NIM;
    }
    
    const isCommittee = await CommitteeModel.exists({
      agendaId: id,
      member: user.member?._id
    });
    
    if (!isCommittee && !meIsCommittee && !organizer) {
      throw createError({
        statusCode: 401,
        statusMessage: "Cannot delete other's committee or not a committee",
      });
    }
    
    if (
      committee.payment?.status === "pending" &&
      committee.payment.transaction_id
    ) {
      const cancel = await cancelPayment(committee.payment.transaction_id);
      if (cancel.status_code !== "200") {
        throw createError({
          statusCode: 500,
          statusMessage: "Failed to cancel payment",
          data: { message: cancel.status_message },
        });
      }
    }

    await CommitteeModel.findByIdAndDelete(registeredId);
    return {
      statusCode: 200,
      statusMessage: "Success deleted " + fullName + " from committee",
    };
  } catch (error: any) {
    console.error("Error deleting committee:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message,
    });
  }
});
