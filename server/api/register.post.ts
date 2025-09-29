import { Types } from "mongoose";
import { UserModel } from "~~/server/models/UserModel";
import { IMember } from "~~/types";
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
  const body = await readBody<IReqRegister>(event);
  const memberFound = await MemberModel.findOne({ NIM: body.NIM });
  const emailExists = await MemberModel.exists({ email: body.email });
  const userFound = await UserModel.findOne({
    $or: [{ username: body.username }, { member: memberFound?._id }],
  });

  if (!memberFound) {
    throw createError({
      statusCode: 400,
      statusMessage: "Your NIM was not found in our records.",
      data: { message: "NIM not found", path: "NIM" },
    });
  }
  if (
    emailExists &&
    (emailExists._id as Types.ObjectId).toString() !==
      (memberFound._id as Types.ObjectId).toString()
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "This email is already registered.",
      data: { message: "Email already registered", path: "email" },
    });
  }
  if (memberFound?.status != "free") {
    throw createError({
      statusCode: 400,
      statusMessage: "This NIM is already registered.",
      data: { message: "NIM already registered", path: "NIM" },
    });
  }
  if (body.password !== body.password_confirmation) {
    throw createError({
      statusCode: 400,
      statusMessage: "Error: Passwords do not match.",
      data: { message: "Passwords do not match", path: "password" },
    });
  }
  if (userFound) {
    if (
      (userFound.member as IMember).id !==
      (memberFound._id as Types.ObjectId).toString()
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "This NIM is already registered.",
        data: { message: "Username already registered", path: "username" },
      });
    }
    userFound.username = body.username;
    userFound.password = body.password;
    registered = await userFound.save();
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
        statusMessage: "Error: Your NIM is already registered.",
        data: {
          message: "This member is already registered",
          path: "changeEmail",
        },
      });
    }

    // Create a new user instance and save it
    const user = new UserModel(form);
    registered = await user.save();
  }

  memberFound.email = body.email;
  await memberFound.save();

  // Check if the user was successfully registered
  if (!registered) {
    throw createError({
      statusCode: 401,
      statusMessage: "Error: Registration failed. Please try again.",
      data: { message: "Registration failed", path: "password" },
    });
  }

  // Return the registered user data
  return {
    statusCode: 200,
    statusMessage: "Registration successful",
    data: registered,
  };
});

function deleteWhiteSpaceOnFirstAndLastChar(str: string) {
  return str.trim();
}
