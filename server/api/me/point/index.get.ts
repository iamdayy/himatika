import { MemberModel } from "~~/server/models/MemberModel";
import { IAgenda, IProject } from "~~/types";
import { IPointMeResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IPointMeResponse> => {
  try {
    const user = event.context.user;
    const { all } = getQuery(event);
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }
    const member = await MemberModel.findOne({ NIM: user.member.NIM })
      .populate({
        path: "agendasCommittee",
        select: "title date at description configuration -_id",
        transform: (doc: IAgenda) => ({
          title: doc.title,
          date: doc.date,
          at: doc.at,
          description: doc.description,
          configuration: doc.configuration,
        }),
      })
      .populate({
        path: "agendasMember",
        select: "title date at description configuration -_id",
        transform: (doc: IAgenda) => ({
          title: doc.title,
          date: doc.date,
          at: doc.at,
          description: doc.description,
          configuration: doc.configuration,
        }),
      })
      .populate({
        path: "projects",
        select: "title deadline description -_id",
        transform: (doc: IProject) => ({
          title: doc.title,
          date: doc.date,
          description: doc.description,
        }),
      })
      .populate({
        path: "aspirations",
      })
      .populate({
        path: "manualPoints",
      })
      .select(
        "NIM avatar fullName email class semester point enteredYear createdAt status"
      );
    if (!member) {
      throw createError({
        statusCode: 404,
        statusMessage: "Member not found",
      });
    }
    if (all) {
      const points = member.point || [];
      return {
        statusCode: 200,
        statusMessage: "Success",
        data: {
          points,
        },
      };
    }
    const pointNow =
      member.point?.find((val) => val.semester == member.semester)?.point || 0;
    return {
      statusCode: 200,
      statusMessage: "Success",
      data: {
        point: pointNow,
      },
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    });
  }
});
