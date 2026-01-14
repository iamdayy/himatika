import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { UserModel } from "~~/server/models/UserModel";
import { MemberModel } from "../models/MemberModel";
import { setSession } from "../utils/Sessions";

const getSecretKey = () => {
  const secretKey = useRuntimeConfig().jwtSecret;
  if (!secretKey) {
    throw new Error("JWT secret key is not configured.");
  }
  return secretKey;
};
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
  try {
    const body = await readBody(event);
    const t = await useTranslationServerMiddleware(event);
    let member;
    const NIM = parseInt(body.username);
    // Check if the username is a number
    if (!isNaN(NIM)) {
      const member = await MemberModel.findOne(
        { NIM },
        {},
        { autopulate: false }
      );
      if (!member) {
        throw createError({
          statusCode: 401,
          statusMessage: t("login_page.user_not_found"),
          data: { message: t("login_page.check_username"), name: "username" },
        });
      }
    }

    // Find user by username
    const user = await UserModel.findOne().or([
      { username: body.username },
      { member: member },
    ]);
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: t("login_page.user_not_found"),
        data: { message: t("login_page.check_username"), name: "username" },
      });
    }
    if (!user?.verified) {
      throw createError({
        statusCode: 401,
        statusMessage: t("login_page.email_not_verified"),
        data: { message: t("login_page.verify_email"), name: "email" },
      });
    }

    // Verify password
    const passMatch = await user.verifyPassword(body.password, user.password);
    if (!passMatch) {
      throw createError({
        statusCode: 401,
        statusMessage: t("login_page.wrong_password"),
        data: { message: t("login_page.check_password"), name: "password" },
      });
    }

    // Generate JWT tokens
    // Disarankan: Access Token pendek (1 hari), Refresh Token panjang (90 hari)
    const token = jwt.sign({ user: user._id }, getSecretKey(), {
      expiresIn: "1d", // Sebelumnya 1w (terlalu lama untuk access token)
    });
    const refreshToken = jwt.sign({ user: user._id }, getSecretKey(), {
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
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "An error occurred during sign-in.",
      data: error.data || null,
    });
  }
});
