import { SortOrder } from "mongoose";
import { PhotoModel } from "~~/server/models/PhotoModel";
import { IAgenda, IPhoto, IPhotoGrouped, IProject } from "~~/types";
import { IReqPhotoQuery } from "~~/types/IRequestPost";
import { IPhotoResponse } from "~~/types/IResponse";
type ISortable = {
  [key: string]: SortOrder;
};
export default defineCachedEventHandler(
  async (event): Promise<IPhotoResponse> => {
    try {
      const { search, tags, sort, order, page, perPage } =
        getQuery<IReqPhotoQuery>(event);

      const isOrganizer = event.context.organizer;
      if (!isOrganizer) {
        const photos = await PhotoModel.find({
          archived: false,
          onModel: { $in: ["Agenda", "Project"] },
        }).populate({
          path: "on",
          select: "_id slug title description",
          options: { autopopulate: false },
        });
        const groupped = groupByOn(
          photos.map((photo) => photo.toObject()) as IPhoto[]
        );
        return {
          statusCode: 200,
          statusMessage: "Photos fetched",
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

      const photos = await PhotoModel.find(query)
        .populate({
          path: "on",
          select: "_id category title description tags",
          options: { autopopulate: false },
        })
        .sort(sortQuery);
      const groupped = groupByOn(
        photos.map((photo) => photo.toObject()) as IPhoto[]
      );

      const paginated = groupped.slice(
        (page - 1) * perPage,
        (page - 1) * perPage + perPage
      );

      return {
        statusCode: 200,

        statusMessage: "Photos fetched",
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
  },
  {
    maxAge: 60 * 30, // Cache selama 30 Menit
    name: "photo-cache",
    swr: true,
  }
);

function groupByOn(arr: IPhoto[]): IPhotoGrouped[] {
  const result: IPhotoGrouped[] = [];
  arr.forEach((item) => {
    const onValue = item.on as IAgenda | IProject;
    if (!onValue) {
      return;
    }
    let resultIndex: number = -1;
    if (result.length > 0) {
      resultIndex = result.findIndex(
        (photo) => photo._id?.toString() == onValue._id?.toString()
      );
    }

    if (resultIndex === -1) {
      result.push({
        ...onValue,
        photos: [
          {
            image: item.image,
            uploader: item.uploader,
            tags: item.tags,
            archived: item.archived,
            archivedAt: item.archivedAt,
          },
        ],
        type: item.onModel?.toLowerCase() as "agenda" | "project",
      });
    } else {
      result[resultIndex].photos.push({
        image: item.image,
        uploader: item.uploader,
        tags: item.tags,
        archived: item.archived,
        archivedAt: item.archivedAt,
      });
    }
  });
  return Object.values(result);
}
