import { MemberModel } from "~~/server/models/MemberModel";
import { ProjectModel } from "~~/server/models/ProjectModel";
import { IProject } from "~~/types";
import { IProjectMeResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IProjectMeResponse> => {
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
      const projects = await ProjectModel.find({
        members: member._id,
      });
      const projectsCount = await ProjectModel.countDocuments({
        members: member._id,
      });
      return {
        statusCode: 200,
        statusMessage: "Success",
        data: {
          projects: projects as IProject[],
          length: projectsCount,
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
