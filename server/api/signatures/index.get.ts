import { DocModel } from "~~/server/models/DocModel";
import { IReqDocQuery } from "~~/types/IRequestPost";
import { IDocResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IDocResponse> => {
  try {
    const { page, perPage, sort, order, signed } =
      getQuery<IReqDocQuery>(event);
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }
    const userId = await findMemberByNim(user.member.NIM);
    let sortOpt = {};
    if (sort && order) {
      sortOpt = {
        [sort]: order === "asc" ? 1 : -1,
      };
    }
    const docs = await DocModel.find({
      signs: { $elemMatch: { user: userId, signed } },
    })
      .sort(sortOpt)
      .skip((page - 1) * perPage)
      .limit(perPage);
    const totalDocs = await DocModel.countDocuments({
      signs: { $elemMatch: { user: userId, signed } },
    });
    return {
      statusCode: 200,
      statusMessage: "Docs found",
      data: {
        doc: docs.map((doc) => ({ ...doc.toObject(), _id: String(doc._id) })),
        length: totalDocs,
      },
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    });
  }
});
