import { AgendaModel } from "~~/server/models/AgendaModel";
import { CommitteeModel } from "~~/server/models/CommitteeModel";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }
    if (!user.member.organizer) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
      });
    }
    const { id } = event.context.params as { id: string };
    const body = await readBody<{
      member: string;
      job: string;
    }>(event);

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing required parameters",
      });
    }

    const agenda = await AgendaModel.findById(id);

    if (!agenda) {
      throw createError({
        statusCode: 404,
        statusMessage: "Agenda not found",
      });
    }

    // Validate the target member exists — an unvalidated `body.member`
    // previously allowed memberless (member:null) committee rows, which
    // other endpoints' `{member: null}` queries would match for ANY user.
    if (!body.member) {
      throw createError({
        statusCode: 400,
        statusMessage: "Member is required",
      });
    }
    const { MemberModel } = await import("~~/server/models/MemberModel");
    const memberExists = await MemberModel.exists({ _id: body.member });
    if (!memberExists) {
      throw createError({
        statusCode: 400,
        statusMessage: "Member not found",
      });
    }
    const duplicate = await CommitteeModel.exists({
      agendaId: id,
      member: body.member,
    });
    if (duplicate) {
      throw createError({
        statusCode: 409,
        statusMessage: "Member is already a committee of this agenda",
      });
    }

    await CommitteeModel.create({
      agendaId: id,
      member: body.member,
      job: body.job,
      approved: true,
    });

    return {
      statusCode: 200,
      statusMessage: "Committee added successfully",
    };
  } catch (error) {
    console.error("Error adding committee:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
