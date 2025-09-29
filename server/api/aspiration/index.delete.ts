import { AspirationModel } from "~~/server/models/AspirationModel";
import { IMember } from "~~/types";
import { IReqAspirationQuery } from "~~/types/IRequestPost";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const { id } = getQuery<IReqAspirationQuery>(event);
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID is required",
      });
    }
    const aspiration = await AspirationModel.findById(id);
    if (!aspiration) {
      throw createError({
        statusCode: 404,
        statusMessage: "Aspiration not found",
      });
    }
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }
    const isMine = (aspiration.from as IMember).NIM === (user as IMember).NIM;

    const organizer = event.context.organizer;

    if (!organizer && !isMine) {
      // Check if the user is an organizer or the owner of the aspiration
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }
    aspiration.deleted = !aspiration.deleted; // Toggle the deleted status
    await aspiration.save();
    return {
      statusCode: 200,
      statusMessage: "Aspiration deleted",
    };
  } catch (error) {
    console.log(error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
