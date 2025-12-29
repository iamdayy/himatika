import { AgendaModel } from "~~/server/models/AgendaModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { ProjectModel } from "~~/server/models/ProjectModel";
import { IStatsResponse } from "~~/types/IResponse";

export default defineCachedEventHandler(
  async (event): Promise<IStatsResponse> => {
    try {
      const [projects, members, agenda] = await Promise.all([
        ProjectModel.countDocuments(),
        MemberModel.countDocuments(),
        AgendaModel.countDocuments(),
      ]);
      return {
        statusCode: 200,
        statusMessage: "Stats fetched successfully",
        data: {
          projects,
          members,
          agenda,
        },
      };
    } catch (error: any) {
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage:
          error.message || "An error occurred while fetching stats.",
      });
    }
  },
  {
    maxAge: 60 * 60 * 24, // Cache selama 1 Hari,
    name: "stats-cache",
    swr: true,
  }
);
