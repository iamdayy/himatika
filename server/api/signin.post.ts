import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { UserModel } from "~~/server/models/UserModel";
import { MemberModel } from "../models/MemberModel";
import { setSession } from "../utils/Sessions";

/**
 * Handles user sign-in process.
 *
 * This function authenticates a user, checks their member status,
 * generates JWT tokens, and sets up a session.
 *
 * @param {H3Event} event - The H3 event object containing the request details.
 * @returns {Promise<Object>} An object containing the generated token and refresh token.
 * @throws {H3Error} If authentication fails or user's member is not active.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  let memberId: Types.ObjectId | undefined;
  const NIM = parseInt(body.username);
  // Check if the username is a number
  if (!isNaN(NIM)) {
    const member = await findMemberByNim(NIM);
    if (!member) {
      throw createError({
        statusCode: 401,
        statusMessage: "User not found",
        data: { message: "Please check your username", name: "username" },
      });
    }
    memberId = member;
  }

  // Find user by username
  const user = await UserModel.findOne({
    $or: [{ username: body.username }, { member: memberId }],
  });
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "User not found",
      data: { message: "Please check your username", name: "username" },
    });
  }
  if (!user?.verified) {
    throw createError({
      statusCode: 401,
      statusMessage: "Please verified your email first",
      data: { message: "Please verify your email", name: "email" },
    });
  }

  // Verify password
  const passMatch = await user.verifyPassword(body.password, user.password);
  if (!passMatch) {
    throw createError({
      statusCode: 401,
      statusMessage: "Please check your password",
      data: { message: "Please check your password", name: "password" },
    });
  }

  // Check user's member status
  const member = await MemberModel.findOne({ NIM: user.member.NIM });
  if (member?.status !== "active") {
    await UserModel.deleteOne({ username: body.username });
    throw createError({
      statusCode: 406,
      statusMessage: `Your membership is ${member?.status}, so this user is deleted`,
      data: { message: "Your membership is not active", name: "username" },
    });
  }

  // Generate JWT tokens
  const token = jwt.sign({ user: user._id }, "HimatikaUser", {
    expiresIn: "1w",
  });
  const refreshToken = jwt.sign({ user: user._id }, "HimatikaUser", {
    expiresIn: "90d",
  });

  // Set up session
  await setSession({
    token,
    refreshToken,
    user: user._id as Types.ObjectId,
  });

  // Return tokens
  return {
    token,
    refreshToken,
  };
});
