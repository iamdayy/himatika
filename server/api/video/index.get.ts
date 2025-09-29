import { SortOrder } from "mongoose";
import { VideoModel } from "~~/server/models/VideoModel";
import { IAgenda, IProject, IVideo, IVideoGrouped } from "~~/types";
import { IReqVideoQuery } from "~~/types/IRequestPost";
import { IVideoResponse } from "~~/types/IResponse";
type ISortable = {
  [key: string]: SortOrder;
};
export default defineEventHandler(async (event): Promise<IVideoResponse> => {
  try {
    const { search, tags, sort, order, page, perPage } =
      getQuery<IReqVideoQuery>(event);

    const isOrganizer = event.context.organizer;
    if (!isOrganizer) {
      const videos = await VideoModel.find({
        archived: false,
        onModel: { $in: ["Agenda", "Project"] },
      }).populate({
        path: "on",
        select: "_id slug title description",
        options: { autopopulate: false },
      });
      const groupped = groupByOn(
        videos.map((video) => video.toObject()) as IVideo[]
      );
      return {
        statusCode: 200,
        statusMessage: "Videos fetched",
        data: {
          length: groupped.length,
          data: groupped,
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

    const videos = await VideoModel.find(query)
      .populate({
        path: "on",
        select: "_id category title description tags",
        options: { autopopulate: false },
      })
      .sort(sortQuery);
    const groupped = groupByOn(
      videos.map((video) => video.toObject()) as IVideo[]
    );

    const paginated = groupped.slice(
      (page - 1) * perPage,
      (page - 1) * perPage + perPage
    );

    return {
      statusCode: 200,

      statusMessage: "Videos fetched",
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

function groupByOn(arr: IVideo[]): IVideoGrouped[] {
  const result: IVideoGrouped[] = [];
  arr.forEach((item) => {
    const onValue = item.on as IAgenda | IProject;
    if (!onValue) {
      return;
    }
    let resultIndex: number = -1;
    if (result.length > 0) {
      resultIndex = result.findIndex(
        (video) => video._id?.toString() == onValue._id?.toString()
      );
    }

    if (resultIndex === -1) {
      result.push({
        ...onValue,
        videos: [
          {
            video: item.video,
            uploader: item.uploader,
            tags: item.tags,
            archived: item.archived,
            archivedAt: item.archivedAt,
          },
        ],
        type: item.onModel?.toLowerCase() as "agenda" | "project",
      });
    } else {
      result[resultIndex].videos.push({
        video: item.video,
        uploader: item.uploader,
        tags: item.tags,
        archived: item.archived,
        archivedAt: item.archivedAt,
      });
    }
  });
  return Object.values(result);
}
