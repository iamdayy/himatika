import { MemberModel } from "~~/server/models/MemberModel";
import { ILastPointResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<ILastPointResponse> => {
    try {
      const user = event.context.user;
      if (!user) {
        throw createError({
          statusCode: 401,
          statusMessage: "Unauthorized",
        });
      }

      const member = await MemberModel.findOne({
        NIM: user.member.NIM,
      })
        .populate("agendasMember")
        .populate("agendasCommittee")
        .populate("aspirations")
        .populate("projects")
        .populate("manualPoints")
        .select("point");
      if (!member) {
        throw createError({
          statusCode: 404,
          statusMessage: "Member not found",
        });
      }
      if (!member.point) {
        throw createError({
          statusCode: 404,
          statusMessage: "Point not found",
        });
      }

      return {
        statusCode: 200,
        statusMessage: "OK",
        data: {
          point: member.point[0],
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
