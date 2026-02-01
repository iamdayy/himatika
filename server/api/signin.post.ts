import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { AuditLogModel } from "~~/server/models/AuditLogModel";
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
      member = await MemberModel.findOne({ NIM }, {}, { autopulate: false });
    }

    // Find user by username
    const user = await UserModel.findOne().or([
      { username: body.username },
      { member: member },
    ]);

    const invalidCredentialsError = createError({
      statusCode: 401,
      statusMessage: t("login_page.invalid_credentials") || "Kredensial tidak valid",
    });

    if (!user) {
      throw invalidCredentialsError;
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
      throw invalidCredentialsError;
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
    
    // Audit Log: Login
    // Note: getRequestIP needs to be handled carefully in production (e.g. x-forwarded-for)
    const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
    await AuditLogModel.create({
        action: 'LOGIN',
        user: user.member, // or user._id
        ip: ip,
        details: { username: body.username },
        target: 'Auth'
    });

    // Return tokens
    return {
      token,
      refreshToken,
    };
  } catch (error: any) {
    console.error(error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Terjadi kesalahan saat masuk.",
      data: error.data || null,
    });
  }
});
