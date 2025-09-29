import { MessageModel } from "~~/server/models/MessageModel";
import { IReqMessage } from "~~/types/IRequestPost";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const body = await readBody<IReqMessage>(event);

    const message = await MessageModel.create({
      ...body,
    });

    if (!message) {
      return {
        statusCode: 404,
        statusMessage: "Message not created",
      };
    }
    return {
      statusCode: 200,

      statusMessage: "Message created",
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
