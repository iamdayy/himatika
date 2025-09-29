import { DocModel } from "~~/server/models/DocModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { IDoc } from "~~/types";
import { IReqDocQuery } from "~~/types/IRequestPost";
import { IDocsMeResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IDocsMeResponse> => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }
    const { page, perPage, sort, order, search } =
      getQuery<IReqDocQuery>(event);
    const member = await MemberModel.findOne({ NIM: user.member.NIM });
    if (!member) {
      throw createError({
        statusCode: 404,
        statusMessage: "Member not found",
      });
    }
    let query: any = {
      uploader: member._id,
    };
    if (search) {
      query.$or = [
        { label: { $regex: search, $options: "i" } },
        { no: { $regex: search, $options: "i" } },
      ];
    }
    const docs = await DocModel.find(query)
      .skip((Number(page) - 1) * Number(perPage))
      .limit(Number(perPage))
      .sort({
        [sort]: order === "asc" ? 1 : -1,
      });
    const docsCount = await DocModel.countDocuments(query);
    if (!docs) {
      throw createError({
        statusCode: 404,
        statusMessage: "Documents not found",
      });
    }
    return {
      statusCode: 200,
      statusMessage: "Success",
      data: {
        docs: docs as IDoc[],
        length: docsCount,
      },
    };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    };
  }
});
