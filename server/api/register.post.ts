import mongoose, { Types } from "mongoose";
import { z } from "zod";
import { UserModel } from "~~/server/models/UserModel";
import { IRegisterResponse } from "~~/types/IResponse";
import { MemberModel } from "../models/MemberModel";

const registerSchema = z.object({
  username: z.string().min(1, "Username diperlukan"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  password_confirmation: z.string(),
  NIM: z.union([z.string(), z.number()]).transform(val => Number(val))
}).refine(data => data.password === data.password_confirmation, {
  message: "Konfirmasi password tidak cocok",
  path: ["password_confirmation"]
});

/**
 * Handles POST requests for user registration.
 */
export default defineEventHandler(async (event): Promise<IRegisterResponse> => {
  let registered = null;
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const rawBody = await readBody(event);
    const validation = registerSchema.safeParse(rawBody);
    const t = await useTranslationServerMiddleware(event);

    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validasi gagal",
        data: validation.error.format(),
      });
    }

    const body = validation.data;
    const memberFound = await MemberModel.findOne({ NIM: body.NIM });
    const emailExists = await MemberModel.exists({ email: body.email });
    
    const usernameTaken = await UserModel.findOne({ username: body.username });
    if (usernameTaken && usernameTaken.member?.toString() !== memberFound?._id?.toString()) {
      throw createError({
        statusCode: 409,
        statusMessage: "Username sudah digunakan",
        data: { message: "Username sudah digunakan", path: "username" },
      });
    }

    const userFound = await UserModel.findOne({
      member: memberFound?._id as any
    });

    if (!memberFound) {
      throw createError({
        statusCode: 400,
        statusMessage: t("register_page.nim_not_found"),
        data: { message: t("register_page.check_nim"), path: "NIM" },
      });
    }
    
    if (
      emailExists &&
      (emailExists._id as Types.ObjectId).toString() !==
        (memberFound._id as Types.ObjectId).toString()
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: t("register_page.email_already_registered"),
        data: { message: t("register_page.check_email"), path: "email" },
      });
    }
    
    if (memberFound?.status != "free") {
      throw createError({
        statusCode: 400,
        statusMessage: t("register_page.member_not_free"),
        data: { message: t("register_page.check_member"), path: "NIM" },
      });
    }

    // Keep custom password validation (complexity checks etc)
    validatePassword(body.password);

    if (userFound) {
      userFound.username = body.username;
      userFound.password = body.password;
      registered = await userFound.save({ session });
      if (!registered) {
        throw createError({
          statusCode: 401,
          statusMessage: t("register_page.registration_failed"),
          data: {
            message: t("register_page.registration_again"),
            path: "password",
          },
        });
      }
    } else {
      const form = {
        ...body,
        username: deleteWhiteSpaceOnFirstAndLastChar(body.username),
        member: memberFound.id,
      };
      
      const userAlreadyExists = await UserModel.findOne({
        member: memberFound._id as any,
      });
      
      if (userAlreadyExists) {
        throw createError({
          statusCode: 405,
          statusMessage: t("register_page.member_already_registered"),
          data: {
            message: t("register_page.check_member"),
            path: "email",
          },
        });
      }

      const user = new UserModel(form);
      registered = await user.save({ session });
    }

    memberFound.email = body.email;
    await memberFound.save({ session });
    await session.commitTransaction();

    if (!registered) {
      throw createError({
        statusCode: 401,
        statusMessage: t("register_page.registration_failed"),
        data: {
          message: t("register_page.registration_again"),
          path: "password",
        },
      });
    }

    return {
      statusCode: 200,
      statusMessage: t("register_page.registration_success"),
      data: registered,
    };
  } catch (error: any) {
    await session.abortTransaction();
    console.error(error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage:
        error.statusMessage || "Terjadi kesalahan saat pendaftaran.",
      data: error.data || null,
    });
  } finally {
    await session.endSession();
  }
});

function deleteWhiteSpaceOnFirstAndLastChar(str: string) {
  return str.trim();
}
