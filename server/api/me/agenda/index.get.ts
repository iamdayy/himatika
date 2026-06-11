import { AgendaModel } from "~~/server/models/AgendaModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { validateSortField } from "~~/server/utils/validateQueryParams";
import { IAgenda } from "~~/types";
import { IReqAgendaQuery } from "~~/types/IRequestPost";
import { IAgendaMeResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IAgendaMeResponse> => {
  try {
    const { status, page, perPage, search, sort, order, showMissed } =
      getQuery<IReqAgendaQuery>(event);
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
    let agendas: IAgenda[] = [];
    let length: number;
    let query: any = {};
    let skip: number = (page - 1) * perPage;
    let limit: number = perPage;
    if (page == 0 && perPage == 0) {
      skip = 0;
      limit = 0;
    }
    let sortOpt: any = {};

    if (search) {
      query = {
        ...query,
        $or: [{ title: { $regex: search, $options: "i" } }],
      };
    }
    if (!showMissed || showMissed === "false") {
      query = {
        ...query,
        "date.start": { $gte: new Date() },
      };
    }

    if (sort && order) {
      validateSortField("agenda", sort);
      sortOpt = {
        [sort]: order === "asc" ? 1 : -1,
      };
    }

    const { ParticipantModel } = await import("~~/server/models/ParticipantModel");
    const { CommitteeModel } = await import("~~/server/models/CommitteeModel");

    const participants = await ParticipantModel.find({ member: member._id });
    const participantAgendaIds = participants.map(p => p.agendaId);

    const committees = await CommitteeModel.find({ member: member._id, approved: true });
    const committeeAgendaIds = committees.map(c => c.agendaId);

    const agendasparticipants = await AgendaModel.find({
      _id: { $in: participantAgendaIds },
      ...query,
    })
      .skip(skip)
      .limit(limit)
      .sort(sortOpt);
      
    const agendasparticipantsCount = await AgendaModel.countDocuments({
      _id: { $in: participantAgendaIds },
      ...query,
    });
    
    const agendascommittees = await AgendaModel.find({
      _id: { $in: committeeAgendaIds },
      ...query,
    })
      .skip(skip)
      .limit(limit)
      .sort(sortOpt);
      
    const agendascommitteesCount = await AgendaModel.countDocuments({
      _id: { $in: committeeAgendaIds },
      ...query,
    });

    return {
      statusCode: 200,
      statusMessage: "Success",
      data: {
        agendas: {
          participant: agendasparticipants,
          committee: agendascommittees,
        },
        length: agendasparticipantsCount + agendascommitteesCount,
      },
    };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    };
  }
});
