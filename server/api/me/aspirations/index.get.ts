import { AspirationModel } from "~~/server/models/AspirationModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { IAspiration } from "~~/types";
import { IAspirationMeResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IAspirationMeResponse> => {
    try {
      const user = event.context.user;
      if (!user) {
        throw createError({
          statusCode: 401,
          statusMessage: "Unauthorized",
        });
      }
      const member = await MemberModel.findOne({ NIM: user.member.NIM });
      if (!member) {
        throw createError({
          statusCode: 404,
          statusMessage: "Member not found",
        });
      }
      const aspirations = await AspirationModel.find({
        from: member._id,
      });
      const aspirationsCount = await AspirationModel.countDocuments({
        from: member._id,
      });
      return {
        statusCode: 200,
        statusMessage: "Success",
        data: {
          aspiration: aspirations as IAspiration[],
          length: aspirationsCount,
        },
      };
    } catch (error: any) {
      return {
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || "Internal Server Error",
      };
    }
  }
);
