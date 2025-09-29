import { MemberModel } from "~~/server/models/MemberModel";
import OrganizerModel from "~~/server/models/OrganizerModel";
import { IAgenda, IMember, IOrganizer, IProject } from "~~/types";
import { IPointResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IPointResponse> => {
  try {
    const members = await MemberModel.find({ status: { $ne: "deleted" } })
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
        path: "organizersDailyManagement",
        model: OrganizerModel,
        transform: (doc: IOrganizer, id: any) => {
          if (doc) {
            return {
              role: doc.dailyManagement.find(
                (daily) => (daily.member as IMember).id == id
              )?.position,
              period: doc.period,
            };
          }
          return null;
        },
      })
      .populate({
        path: "organizersDepartmentCoordinator",
        model: OrganizerModel,
        transform: (doc: IOrganizer, id: any) => {
          if (doc) {
            return {
              role: "Coordinator Departement",
              period: doc.period,
            };
          }
          return null;
        },
      })
      .populate({
        path: "organizersDepartmentMembers",
        model: OrganizerModel,
        transform: (doc: IOrganizer, id: any) => {
          if (doc) {
            return {
              role: "Member Departement",
              period: doc.period,
            };
          }
          return null;
        },
      })
      .populate({
        path: "aspirations",
      })
      .select(
        "NIM avatar fullName email class semester point enteredYear createdAt status"
      );
    const points = members
      .map((member, index) => {
        return {
          fullName: member.fullName,
          NIM: member.NIM,
          semester: member.semester,
          class: member.class,
          point: member.point,
          avatar: member.avatar,
          no: index + 1,
        };
      })
      .sort((a, b) => {
        if (a.point === b.point) {
          return a.no - b.no;
        }
        return (b.point ?? 0) - (a.point ?? 0);
      });
    const me = points.find(
      (point) => point.NIM === event.context.user.member.NIM
    );
    if (!me) {
      return {
        statusCode: 404,
        statusMessage: "Not Found",
      };
    }
    if (me.no > 5) {
      points.push(me);
    }
    return {
      statusCode: 200,
      statusMessage: "Success",
      data: {
        points: points.slice(0, 5),
      },
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      statusMessage: error.message,
    };
  }
});
