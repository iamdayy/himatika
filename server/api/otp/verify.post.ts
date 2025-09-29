import { MemberModel } from "~~/server/models/MemberModel";
import { OTPModel } from "~~/server/models/OTPModel";
import { UserModel } from "~~/server/models/UserModel";
import { generateToken } from "~~/server/utils/TokenHelper";
import { IReqVerifyOTP } from "~~/types/IRequestPost";
import { IVerifyOTPResponse } from "~~/types/IResponse";
export default defineEventHandler(
  async (event): Promise<IVerifyOTPResponse> => {
    try {
      const { code, email, type } = await readBody<IReqVerifyOTP>(event);
      const otp = await OTPModel.findOne({ email, type });

      if (!otp) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid OTP",
        });
      }

      if (otp.code !== code) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid OTP",
        });
      }

      if (otp.expiresAt < new Date()) {
        throw createError({
          statusCode: 400,
          statusMessage: "OTP expired",
        });
      }
      const member = await MemberModel.findOne({
        $or: [{ email }, { NIM: otp.NIM }],
      });
      if (!member) {
        throw createError({
          statusCode: 404,
          statusMessage: "Member not found",
          data: { message: "Email not found", name: "email" },
        });
      }
      const user = await UserModel.findOne({ member: member._id });
      if (!user) {
        throw createError({
          statusCode: 404,
          statusMessage: "User not found",
        });
      }
      const token = await generateToken(member.email, otp.code, otp.type);

      return {
        statusCode: 200,
        statusMessage: "OTP verified successfully!",
        data: {
          token,
          type,
        },
      };
    } catch (error: any) {
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || "Internal Server Error",
      });
    }
  }
);
