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
        statusMessage: "Email tidak valid atau hilang",
      });
    }

    if (!token || typeof token !== "string" || token.trim() === "") {
      throw createError({
        statusCode: 400,
        statusMessage: "Token tidak valid atau hilang",
      });
    }

    const otpData = await OTPModel.findOne({ email });

    if (!otpData) {
      throw createError({
        statusCode: 400,
        statusMessage: "Email tidak valid",
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
        statusMessage: "Token tidak valid",
      });
    }

    const member = await MemberModel.findOne({
      email,
      NIM: otpData.NIM,
    });

    if (!member) {
      throw createError({
        statusCode: 400,
        statusMessage: "Anggota tidak ditemukan",
      });
    }

    const user = await UserModel.findOne({ member: member });
    if (!user) {
      throw createError({
        statusCode: 400,
        statusMessage: "Pengguna tidak ditemukan",
      });
    }
    await findMemberAndMarkRegister(member._id as Types.ObjectId, email);
    user.verified = true;
    await user.save();
    await OTPModel.deleteOne({ email });
    return {
      statusCode: 200,
      statusMessage: `Pengguna berhasil diverifikasi, selamat datang di keluarga!, ${user.username}`,
    };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Terjadi Kesalahan Server",
    };
  }
});
