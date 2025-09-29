import { AgendaModel } from "~~/server/models/AgendaModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { ProjectModel } from "~~/server/models/ProjectModel";
import { IStatsResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IStatsResponse> => {
  try {
    const projects = await ProjectModel.countDocuments();
    const members = await MemberModel.countDocuments();
    const agenda = await AgendaModel.countDocuments();
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
    return {
      statusCode: 500,
      statusMessage: error.message,
    };
  }
});
