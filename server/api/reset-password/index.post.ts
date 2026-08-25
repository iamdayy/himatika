import { MemberModel } from "~~/server/models/MemberModel";
import { OTPModel } from "~~/server/models/OTPModel";
import { SessionModel } from "~~/server/models/SessionModel";
import { UserModel } from "~~/server/models/UserModel";
import { validatePassword } from "~~/server/utils/validatePassword";
import { FormError } from "~~/types/component/stepper";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IResponse & { data?: FormError }> => {
    try {
      const { token, code, password, password_confirmation } = await readBody(
        event
      );
      const otp = await OTPModel.findOne({ code, type: "Reset Password" });
      if (!otp) {
        throw {
          statusCode: 400,
          statusMessage: "Invalid OTP",
          data: {
            message: "Invalid OTP",
            path: "otp",
          },
        };
      }
      const verifiedToken = await verifyToken(
        token,
        otp.email,
        otp.code,
        otp.type
      );
      if (!verifiedToken) {
        throw {
          statusCode: 400,
          statusMessage: "Invalid token",
          data: {
            message: "Invalid token",
          },
        };
      }
      const member = await MemberModel.findOne({ email: otp.email });
      if (!member) {
        throw {
          statusCode: 404,
          statusMessage: "Member not found",
          data: {
            message: "Member not found",
            path: "email",
          },
        };
      }
      const user = await UserModel.findOne({ member: member });
      if (!user) {
        throw {
          statusCode: 404,
          statusMessage: "User not found",
          data: {
            message: "User not found",
          },
        };
      }
      if (password !== password_confirmation) {
        throw {
          statusCode: 400,
          statusMessage: "Password and password confirmation do not match",
          data: {
            message: "Password and password confirmation do not match",
          },
        };
      }
      
      validatePassword(password);

      user.password = password;
      await user.save();

      // Revoke every session: a stolen refresh token must not survive
      // a password reset.
      await SessionModel.deleteMany({ user: user._id });

      // Consume-once (atomic): the OTP cannot drive a second reset.
      const consumed = await OTPModel.findOneAndUpdate(
        { _id: otp._id, usedAt: null },
        { $set: { usedAt: new Date() } },
        { new: true }
      );
      if (!consumed) {
        throw {
          statusCode: 400,
          statusMessage: "Kode OTP sudah pernah digunakan",
          data: { message: "OTP already used", path: "otp" },
        };
      }

      return {
        statusCode: 200,
        statusMessage: "Succesfully reset password for " + user.username,
      };
    } catch (error: any) {
      // Throw real HTTP errors instead of resolving with an error body
      // under HTTP 200 — clients could not tell success from failure.
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || "Terjadi Kesalahan Server",
        data: error.data,
      });
    }
  }
);
