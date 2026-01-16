import { SortOrder } from "mongoose";
import { DocModel } from "~~/server/models/DocModel";
import { IAgenda, IDoc, IDocGrouped, IMember, IProject } from "~~/types";
import { IReqDocQuery } from "~~/types/IRequestPost";
import { IDocResponse } from "~~/types/IResponse";
type ISortable = {
  [key: string]: SortOrder;
};
export default defineEventHandler(async (event): Promise<IDocResponse> => {
  try {
    const { search, tags, sort, order, page, perPage, id } =
      getQuery<IReqDocQuery>(event);

    const isOrganizer = event.context.organizer;
    const user = event.context.user;
    if (!isOrganizer && !id) {
      const docs = await DocModel.find({
        archived: false,
        onModel: { $in: ["Agenda", "Project"] },
      }).populate({
        path: "on",
        select: "_id slug title description",
        options: { autopopulate: false },
      });
      const groupped = groupByOn(docs.map((doc) => doc.toObject()) as IDoc[]);
      return {
        statusCode: 200,
        statusMessage: "Docs fetched",
        data: {
          length: groupped.length,
          data: groupped,
        },
      };
    }
    if (id) {
      if (!user) {
        return {
          statusCode: 401,
          statusMessage: "Unauthorized",
        };
      }
      const doc = await DocModel.findById(id);
      if (!doc) {
        return {
          statusCode: 404,
          statusMessage: "Doc not found",
        };
      }
      if ((doc.uploader as IMember).NIM !== user.member.NIM && !isOrganizer) {
        return {
          statusCode: 403,
          statusMessage: "Unauthorized",
        };
      }
      const signedByMe = doc.signs?.find(
        (sign) => (sign.user as IMember).NIM == user.member.NIM
      )?.signed;
      return {
        statusCode: 200,
        statusMessage: "Doc fetched",
        data: {
          doc: doc.toObject() as IDoc,
          length: 1,
          signedByMe,
        },
      };
    }

    let query: any = {
      onModel: { $in: ["Agenda", "Project"] },
    };
    let sortQuery: ISortable = {};

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    if (tags && JSON.parse(tags).length > 0) {
      query.tags = { $in: JSON.parse(tags) };
    }
    if (sort && order) {
      sortQuery = {
        [sort]: order == "asc" ? 1 : -1,
      };
    }
    const docs = await DocModel.find(query)
      .populate({
        path: "on",
        select: "_id category title description tags",
        options: { autopopulate: false },
      })
      .sort(sortQuery);
    const groupped = groupByOn(docs.map((doc) => doc.toObject()) as IDoc[]);

    const paginated = groupped.slice(
      (page - 1) * perPage,
      (page - 1) * perPage + perPage
    );

    return {
      statusCode: 200,

      statusMessage: "Docs fetched",
      data: {
        data: paginated,
        length: groupped.length,
      },
    };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Internal Server Error",
    };
  }
});

function groupByOn(arr: IDoc[]): IDocGrouped[] {
  const result: IDocGrouped[] = [];
  arr.forEach((item) => {
    const onValue = item.on as IAgenda | IProject;
    if (!onValue) {
      return;
    }
    let resultIndex: number = -1;
    if (result.length > 0) {
      resultIndex = result.findIndex(
        (doc) => doc._id?.toString() == onValue._id?.toString()
      );
    }

    if (resultIndex === -1) {
      result.push({
        ...onValue,
        docs: [
          {
            doc: item.doc,
            no: item.no,
            uploader: item.uploader,
            tags: item.tags,
            archived: item.archived,
            archivedAt: item.archivedAt,
            label: item.label,
          },
        ],
        type: item.onModel?.toLowerCase() as "agenda" | "project",
      });
    } else {
      result[resultIndex].docs.push({
        doc: item.doc,
        no: item.no,
        uploader: item.uploader,
        tags: item.tags,
        archived: item.archived,
        archivedAt: item.archivedAt,
        label: item.label,
      });
    }
  });
  return Object.values(result);
}
