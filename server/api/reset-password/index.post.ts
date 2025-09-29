import { MemberModel } from "~~/server/models/MemberModel";
import { OTPModel } from "~~/server/models/OTPModel";
import { UserModel } from "~~/server/models/UserModel";
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
      const user = await UserModel.findOne({ member: member._id });
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
            path: "password_confirmation",
          },
        };
      }
      user.password = password;
      await user.save();
      return {
        statusCode: 200,
        statusMessage: "Succesfully reset password for " + user.username,
      };
    } catch (error: any) {
      return {
        statusCode: error.statusCode,
        statusMessage: error.statusMessage,
        data: error.data,
      };
    }
  }
);
