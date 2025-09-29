import { SortOrder } from "mongoose";
import { MessageModel } from "~~/server/models/MessageModel";
import { IReqMessageQuery } from "~~/types/IRequestPost";
import { IMessageResponse } from "~~/types/IResponse";

type ISortable = {
  [key: string]: SortOrder;
};

export default defineEventHandler(async (event): Promise<IMessageResponse> => {
  try {
    const { search, page, perPage, sort, order, filterBy, filter, deleted } =
      getQuery<IReqMessageQuery>(event);
    const query: any = {
      deleted: false,
    };
    let sortOpt: ISortable = {};
    if (order && sort) {
      sortOpt[sort] = order as SortOrder;
    }
    if (search) {
      query.subject = { $regex: search, $options: "i" };
    }
    if (filterBy && filter) {
      query[filterBy] = filter;
    }
    const organizer = event.context.organizer;
    if (deleted && deleted === "true" && organizer) {
      query.deleted = { $in: [true, false] };
    }
    const message = await MessageModel.find(query)
      .skip((Number(page) - 1) * Number(perPage))
      .limit(Number(perPage))
      .sort(sortOpt);
    const length = await MessageModel.countDocuments(query);
    if (!message) {
      return {
        statusCode: 404,
        statusMessage: "Message not found",
      };
    }
    return {
      statusCode: 200,
      statusMessage: "Message found",
      data: {
        messages: message.map((s) => s.toObject()),
        length,
      },
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
