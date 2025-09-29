import { Types } from "mongoose";
import { MemberModel } from "~~/server/models/MemberModel";
import { OTPModel } from "~~/server/models/OTPModel";
import { UserModel } from "~~/server/models/UserModel";
import { verifyToken } from "~~/server/utils/TokenHelper";
import { IResponse } from "~~/types/IResponse";

/**
 * Handles POST requests for verifying user account.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<IResponse>} The response object.
 * @throws {H3Error} If an error occurs during the process.
 * @example
 * // Request
 * {
 *  "email": "
 * "token": "123456"
 * }
 *  // Response
 * {
 * "statusCode": 200,
 * "statusMessage": "User verified successfully, welcome to the family!, ${user.username}"
 * }
 *  @example
 * // Error Response
 * {
 * "statusCode": 400,
 * "statusMessage": "Invalid or missing email"
 * }
 */
export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const { email, token } = await readBody(event);

    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid or missing email",
      });
    }

    if (!token || typeof token !== "string" || token.trim() === "") {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid or missing TOKEN",
      });
    }

    const otpData = await OTPModel.findOne({ email });

    if (!otpData) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid Email",
      });
    }

    const verifiedToken = await verifyToken(
      token,
      email,
      otpData.code,
      otpData.type
    );

    if (!verifiedToken) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid Token",
      });
    }

    const member = await MemberModel.findOne({
      email,
      NIM: otpData.NIM,
    });

    if (!member) {
      throw createError({
        statusCode: 400,
        statusMessage: "Member not found",
      });
    }

    const user = await UserModel.findOne({ member: member._id });
    if (!user) {
      throw createError({
        statusCode: 400,
        statusMessage: "User not found",
      });
    }
    await findMemberAndMarkRegister(member._id as Types.ObjectId, email);
    user.verified = true;
    await user.save();
    await OTPModel.deleteOne({ email });
    return {
      statusCode: 200,
      statusMessage: `User verified successfully, welcome to the family!, ${user.username}`,
    };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    };
  }
});
