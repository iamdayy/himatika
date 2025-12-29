import mongoose, { Types } from "mongoose";
import { UserModel } from "~~/server/models/UserModel";
import { IReqRegister } from "~~/types/IRequestPost";
import { IRegisterResponse } from "~~/types/IResponse";
import { MemberModel } from "../models/MemberModel";

/**
 * Handles POST requests for user registration.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<IRegisterResponse>} A promise that resolves to the registered user data.
 * @throws {H3Error} If the NIM is not found or if registration fails.
 */
export default defineEventHandler(async (event): Promise<IRegisterResponse> => {
  // Read the request body
  let registered = null;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const body = await readBody<IReqRegister>(event);
    const t = await useTranslationServerMiddleware(event);
    const memberFound = await MemberModel.findOne({ NIM: body.NIM });
    const emailExists = await MemberModel.exists({ email: body.email });
    const userFound = await UserModel.findOne({
      $or: [{ username: body.username }, { member: memberFound?._id }],
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
    if (body.password !== body.password_confirmation) {
      throw createError({
        statusCode: 400,
        statusMessage: t("register_page.password_not_match"),
        data: { message: t("register_page.check_password"), path: "password" },
      });
    }
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
      // Prepare the user registration form
      const form = {
        ...body,
        username: deleteWhiteSpaceOnFirstAndLastChar(body.username),
        member: memberFound.id,
      };
      const userAlreadyExists = await UserModel.findOne({
        member: memberFound._id,
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

      // Create a new user instance and save it
      const user = new UserModel(form);
      registered = await user.save();
    }

    memberFound.email = body.email;
    await memberFound.save({ session });
    await session.commitTransaction();

    // Check if the user was successfully registered
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

    // Return the registered user data
    return {
      statusCode: 200,
      statusMessage: t("register_page.registration_success"),
      data: registered,
    };
  } catch (error: any) {
    await session.abortTransaction();
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage:
        error.statusMessage || "An error occurred during registration.",
      data: error.data || null,
    });
  } finally {
    await session.endSession();
  }
});

function deleteWhiteSpaceOnFirstAndLastChar(str: string) {
  return str.trim();
}
