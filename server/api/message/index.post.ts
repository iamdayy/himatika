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
        statusMessage: "Gagal membuat pesan",
      };
    }
    return {
      statusCode: 200,

      statusMessage: "Pesan berhasil dibuat",
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Terjadi Kesalahan Server",
    });
  }
});
