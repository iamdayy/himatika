import { SortOrder } from "mongoose";
import { MemberModel } from "~~/server/models/MemberModel";
import OrganizerModel from "~~/server/models/OrganizerModel";
import { PointModel } from "~~/server/models/PointModel";
import { validateFilterByField, validateSortField } from "~~/server/utils/validateQueryParams";
import { IAgenda, IMember, IOrganizer, IProject } from "~~/types";
import { IReqMemberQuery } from "~~/types/IRequestPost";
import { IMemberResponse } from "~~/types/IResponse";

type ISortable = {
  [key: string]: SortOrder;
};

/**
 * Handles GET requests for retrieving user members.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<Object>} An object containing members, total count, and filters.
 * @throws {H3Error} If the user is not authorized or if a system error occurs.
 */
export default defineEventHandler(async (event): Promise<IMemberResponse> => {
  try {
    let { NIM, perPage, page, order, sort, search, filter, filterBy, deleted } =
      getQuery<IReqMemberQuery>(event);

    // Ensure user is authenticated and authorized
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "You must be logged in to access this",
      });
    }

    // If NIM is provided without pagination, return a single member
    if (NIM && !perPage && !page) {
      const member = await MemberModel.findOne({ NIM })
        .select("-phone -address -religion -citizen -birth") // Exclude Sensitive PII
        .populate({
          path: "committeesData",
          populate: {
            path: "agendaId",
            select: "title date at description configuration committees -_id",
            transform: (doc: IAgenda) => ({
              title: doc.title,
              date: doc.date,
              at: doc.at,
              description: doc.description,
              configuration: doc.configuration,
            }),
          }
        })
        .populate({
          path: "participantsData",
          populate: {
            path: "agendaId",
            select: "title date at description configuration participants -_id",
            transform: (doc: IAgenda) => ({
              title: doc.title,
              date: doc.date,
              at: doc.at,
              description: doc.description,
              configuration: doc.configuration,
            }),
          }
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
                  (daily) => (daily.member as IMember)?.id == id
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
        .populate({
          path: "manualPoints",
          model: PointModel,
          select: "amount reason type date status -_id",
        })
        .lean();

      if (!member) {
        throw createError({
          statusCode: 404,
          statusMessage: "Member not found",
        });
      }
      return {
        statusCode: 200,
        statusMessage: "Member fetched",
        data: {
          member: {
            ...member,
            aspirations: member.aspirations?.filter(
              (aspiration: any) => aspiration.anonymous === false
            ),
          },
        },
      };
    }

    let query: any = {};
    let sortOpt: ISortable = {};

    // Apply filters based on query parameters
    if (deleted == "false") {
      query.status = { $nin: "deleted" };
    }
    if (order && sort) {
      validateSortField("member", sort);
      sortOpt[sort] = order as SortOrder;
    }
    if (filter && filterBy) {
      validateFilterByField("member", filterBy);
      query[filterBy] = filter;
    }
    if (NIM) {
      query.NIM = NIM;
    }
    if (search && search.trim() !== "") {
      query.$or = [
        // { NIM: search },
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { class: { $regex: search, $options: "i" } },
      ];
    }

    if (!user.member.organizer) {
      throw createError({
        statusCode: 401,
        statusMessage: "You must be admin / departement to access this",
      });
    }

    // Count total documents matching the query
    const length = await MemberModel.countDocuments(query);

    // Get unique filter values if filterBy is provided
    let filters: string[] | null = null;
    if (filterBy) {
      const membersFilters = await MemberModel.find({
        status: { $ne: "deleted" },
      }).select(filterBy as keyof IMember);
      filters = [...new Set(membersFilters.map((v) => v[filterBy as keyof IMember]))];
    }

    // === AGGREGATION PIPELINE UNTUK LIST ===
    const membersRaw = await MemberModel.aggregate([
      { $match: query },
      { $sort: Object.keys(sortOpt).length ? (sortOpt as Record<string, 1 | -1>) : { createdAt: -1 } },
      { $skip: Number(page) * Number(perPage) },
      { $limit: Number(perPage) },
      
      // Lookups minimalis untuk poin
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "members",
          as: "projects",
          pipeline: [ { $project: { date: 1, published: 1 } } ]
        }
      },
      {
        $lookup: {
          from: "aspirations",
          localField: "_id",
          foreignField: "member",
          as: "aspirations",
          pipeline: [ { $project: { createdAt: 1, deleted: 1, archived: 1 } } ]
        }
      },
      {
        $lookup: {
          from: "pointlogs", // PointModel defaults to "pointlogs" or "points", assume pointlogs based on Mongoose pluralize
          localField: "_id",
          foreignField: "member",
          as: "manualPoints",
          pipeline: [ { $match: { status: "approved" } }, { $project: { amount: 1, date: 1, status: 1 } } ]
        }
      },
      {
         $lookup: {
             from: "participants",
             localField: "_id",
             foreignField: "member",
             as: "participantsData",
             pipeline: [
                 { $match: { visiting: true } },
                 {
                    $lookup: {
                        from: "agendas",
                        localField: "agendaId",
                        foreignField: "_id",
                        as: "agendaId",
                    }
                 },
                 { $unwind: { path: "$agendaId", preserveNullAndEmptyArrays: true } },
                 {
                    $project: {
                        visiting: 1,
                        "agendaId.date": 1,
                        "agendaId.configuration.participant": 1
                    }
                 }
             ]
         }
      },
      {
         $lookup: {
             from: "committees",
             localField: "_id",
             foreignField: "member",
             as: "committeesData",
             pipeline: [
                 { $match: { visiting: true, approved: true } },
                 {
                    $lookup: {
                        from: "agendas",
                        localField: "agendaId",
                        foreignField: "_id",
                        as: "agendaId",
                    }
                 },
                 { $unwind: { path: "$agendaId", preserveNullAndEmptyArrays: true } },
                 {
                    $project: {
                        visiting: 1,
                        approved: 1,
                        "agendaId.date": 1,
                        "agendaId.configuration.committee": 1
                    }
                 }
             ]
         }
      },
      // Lookup Organizers to display positions
      {
         $lookup: {
            from: "organizers",
            localField: "_id",
            foreignField: "dailyManagement.member",
            as: "orgDM",
         }
      },
      {
         $lookup: {
            from: "organizers",
            localField: "_id",
            foreignField: "departmentCoordinator",
            as: "orgDC",
         }
      },
      {
         $lookup: {
            from: "organizers",
            localField: "_id",
            foreignField: "departmentMembers",
            as: "orgDMbr",
         }
      },
      {
         $lookup: {
            from: "organizers",
            localField: "_id",
            foreignField: "considerationBoard",
            as: "orgCB",
         }
      }
    ]);

    // Format final response & kalkulasi poin menggunakan TypeScript untuk current semester
    const members = membersRaw.map((raw) => {
      // Logic from `MemberModel.ts` calculatePoints
      const semester = raw.semester || 1;
      const enteredYear = raw.enteredYear || new Date().getFullYear();
      
      const startMonth = (semester - 1) * 6 + 8; // September as month 8
      const start = new Date(enteredYear, startMonth, 1);
      const endMonth = startMonth + 5;
      const end = new Date(enteredYear, endMonth + 1, 0);

      const filterDate = (itemDate: Date | string | undefined) => {
          if (!itemDate) return false;
          const d = new Date(itemDate);
          return d >= start && d <= end;
      };

      const agendasCommittee = (raw.committeesData || []).filter((c: any) => c.approved && c.visiting && c.agendaId?.date && filterDate(c.agendaId?.date?.start));
      const agendasMember = (raw.participantsData || []).filter((p: any) => p.visiting && p.agendaId?.date && filterDate(p.agendaId?.date?.start));
      const projects = (raw.projects || []).filter((p: any) => p.published && filterDate(p.date));
      const aspirations = (raw.aspirations || []).filter((a: any) => !a.deleted && !a.archived && filterDate(a.createdAt));
      const manualPoints = (raw.manualPoints || []).filter((m: any) => filterDate(m.date));

      const cPts = agendasCommittee.reduce((acc: number, c: any) => acc + (c.agendaId?.configuration?.committee?.point || 0), 0);
      const pPts = agendasMember.reduce((acc: number, p: any) => acc + (p.agendaId?.configuration?.participant?.point || 0), 0);
      const prjPts = projects.length * 75;
      const aspPts = aspirations.length * 50;
      const manPts = manualPoints.reduce((acc: number, m: any) => acc + (m.amount || 0), 0);

      // Structure points as an array to match virtual mapping for frontend
      const pointArr = [{
          semester: semester,
          range: { start, end },
          point: cPts + pPts + prjPts + aspPts + manPts
      }];

      // Determine organizer role
      let organizer: any = undefined;
      if (raw.orgCB?.length) organizer = { role: "Consideration Board", period: raw.orgCB[0].period };
      else if (raw.orgDC?.length) organizer = { role: "Coordinator Departement", period: raw.orgDC[0].period };
      else if (raw.orgDMbr?.length) organizer = { role: "Member Departement", period: raw.orgDMbr[0].period };
      else if (raw.orgDM?.length) {
         const dm = raw.orgDM[0].dailyManagement.find((d: any) => d.member.toString() === raw._id.toString());
         if (dm) organizer = { role: dm.position, period: raw.orgDM[0].period };
      }

      return {
        _id: raw._id,
        NIM: raw.NIM,
        fullName: raw.fullName,
        email: raw.email,
        avatar: raw.avatar,
        class: raw.class,
        sex: raw.sex,
        semester: raw.semester,
        enteredYear: raw.enteredYear,
        createdAt: raw.createdAt,
        status: raw.status,
        point: pointArr,
        organizer: organizer
      };
    });

    return {
      statusCode: 200,
      statusMessage: "Members fetched",
      data: {
        members,
        length,
        filters,
      },
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message,
    });
  }
});
