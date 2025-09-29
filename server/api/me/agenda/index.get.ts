import { AgendaModel } from "~~/server/models/AgendaModel";
import { MemberModel } from "~~/server/models/MemberModel";
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
      sortOpt = {
        [sort]: order === "asc" ? 1 : -1,
      };
    }

    if (status === "members") {
      const agendasparticipants = await AgendaModel.find({
        "participants.member": member._id,
        ...query,
      })
        .skip(skip)
        .limit(limit)
        .sort(sortOpt);
      const agendasparticipantsCount = await AgendaModel.countDocuments({
        "participants.member": member._id,
        ...query,
      });
      agendas = agendasparticipants as IAgenda[];
      length = agendasparticipantsCount;
    } else {
      const agendascommittees = await AgendaModel.find({
        "committees.member": member._id,
        ...query,
      })
        .skip(skip)
        .limit(limit)
        .sort(sortOpt);
      const agendascommitteesCount = await AgendaModel.countDocuments({
        "committees.member": member._id,
        ...query,
      });
      agendas = agendascommittees as IAgenda[];
      length = agendascommitteesCount;
    }

    return {
      statusCode: 200,
      statusMessage: "Success",
      data: {
        agendas: agendas as IAgenda[],
        length,
      },
    };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    };
  }
});
