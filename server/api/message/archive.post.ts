import { MessageModel } from "~~/server/models/MessageModel";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const { id } = getQuery<{ id: string }>(event);

    const message = await MessageModel.findById(id);

    if (!message) {
      throw createError({
        statusCode: 404,
        statusMessage: "Message not found",
      });
    }
    message.archived = true;
    await message.save();

    return {
      statusCode: 200,
      statusMessage: "Message archived successfully",
    };
  } catch (error) {
    console.log(error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
