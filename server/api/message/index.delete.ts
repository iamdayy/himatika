import { MessageModel } from "~~/server/models/MessageModel";
import { IReqMessageQuery } from "~~/types/IRequestPost";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const { id } = getQuery<IReqMessageQuery>(event);
    const message = await MessageModel.findByIdAndDelete(id);
    if (!message) {
      throw createError({
        statusCode: 404,
        statusMessage: "Message not found",
      });
    }
    await message.save();
    return {
      statusCode: 200,
      statusMessage: "Message deleted",
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
