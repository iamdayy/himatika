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
    if (!user) {
      return {
        statusCode: 401,
        statusMessage: "Unauthorized",
      };
    }

    const agenda = await AgendaModel.findById(id);
    let fullName = "";
    if (!agenda) {
      return {
        statusCode: 404,
        statusMessage: "Agenda not found",
      };
    }
    const committee = agenda?.committees?.find(
      (r) => r._id?.toString() === registeredId
    );
    if (!committee) {
      return {
        statusCode: 404,
        statusMessage: "Committee not found",
      };
    }
    if (committee.member) {
      fullName = (committee.member as IMember).fullName;
    }
    if (committee.member && user.member) {
      meIsCommittee = (committee.member as IMember).NIM === user.member.NIM;
    }
    const isCommittee = agenda.committees?.some(
      (c) => (c.member as IMember).NIM === user.member.NIM
    );
    if (!isCommittee && !meIsCommittee) {
      return {
        statusCode: 401,
        statusMessage: "Cannot delete other's committee or not a committee",
      };
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
    if (!agenda.committees) {
      throw createError({
        statusCode: 404,
        statusMessage: "Committee not found",
      });
    }
    const indexCommittee = agenda.committees.findIndex(
      (r) => r._id?.toString() === registeredId
    );
    if (!indexCommittee || indexCommittee < 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Committee not found",
      });
    }
    agenda.committees.splice(indexCommittee, 1);
    await agenda.save();
    return {
      statusCode: 200,
      statusMessage: "Success deleted " + fullName + " from committee",
    };
  } catch (error: any) {
    console.error("Error deleting committee:", error);
    return {
      statusCode: 500,
      statusMessage: error.statusMessage || error.message,
    };
  }
});
