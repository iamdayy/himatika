import { z } from "zod";
import { MessageModel } from "~~/server/models/MessageModel";
import type { IResponse } from "~~/types/IResponse";

const messageSchema = z.object({
  name: z.object({
    first: z.string().trim().min(1).max(100),
    last: z.string().trim().max(100).default(""),
  }),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(20),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
  tags: z.array(z.string().trim().max(50)).max(20).default([]),
});

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const rawBody = await readBody(event);
    const validation = messageSchema.safeParse(rawBody);

    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validasi gagal",
        data: validation.error.format(),
      });
    }

    // Destructure known fields only: never pass the raw body to the model,
    // so callers cannot set privileged fields such as `archived`.
    const { name, email, phone, subject, message, tags } = validation.data;
    const created = await MessageModel.create({
      name,
      email,
      phone,
      subject,
      message,
      tags,
    });

    if (!created) {
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal membuat pesan",
      });
    }
    return {
      statusCode: 200,
      statusMessage: "Pesan berhasil dibuat",
    };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof (error as { statusCode: unknown }).statusCode === "number"
    ) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Terjadi Kesalahan Server",
    });
  }
});
