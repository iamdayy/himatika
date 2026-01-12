import { SortOrder } from "mongoose";
import { AspirationModel } from "~~/server/models/AspirationModel";
import { DocModel } from "~~/server/models/DocModel";
import { PhotoModel } from "~~/server/models/PhotoModel";
import { VideoModel } from "~~/server/models/VideoModel";
import { IMember } from "~~/types";
import { IReqAspirationQuery } from "~~/types/IRequestPost";
import { IAspirationResponse } from "~~/types/IResponse";

type ISortable = {
  [key: string]: SortOrder;
};

export default defineEventHandler(
  async (event): Promise<IAspirationResponse> => {
    try {
      const {
        search,
        page,
        perPage,
        sort,
        order,
        filterBy,
        filter,
        deleted,
        id,
      } = getQuery<IReqAspirationQuery>(event);
      const user = event.context.user;
      if (!user) {
        throw createError({
          statusCode: 401,
          statusMessage: "Unauthorized",
        });
      }
      if (id) {
        let voteType;
        const aspiration = await AspirationModel.findById(id)
          .populate({
            path: "photos",
            model: PhotoModel,
          })
          .populate({
            path: "videos",
            model: VideoModel,
          })
          .populate({
            path: "docs",
            model: DocModel,
          });
        if (!aspiration) {
          return {
            statusCode: 404,
            statusMessage: "Aspiration not found",
          };
        }
        aspiration.votes?.forEach((vote) => {
          const exists = (vote.user as IMember).NIM === user.member.NIM;
          if (exists) {
            voteType = vote.voteType;
          }
        });
        if (event.context.organizer) {
          aspiration.read = true;
          await aspiration.save();
        }
        const isMine = (aspiration.from as IMember).NIM === user.member.NIM;
        return {
          statusCode: 200,
          statusMessage: "Aspiration found",
          data: {
            aspiration: aspiration.toObject(),
            voted: voteType ? true : false,
            voteType,
            isMine,
          },
        };
      }
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
      const aspiration = await AspirationModel.find(query)
        .populate({
          path: "photos",
          model: PhotoModel,
        })
        .populate({
          path: "videos",
          model: VideoModel,
        })
        .populate({
          path: "docs",
          model: DocModel,
        })
        .skip((Number(page) - 1) * Number(perPage))
        .limit(Number(perPage))
        .sort(sortOpt);
      const length = await AspirationModel.countDocuments(query);
      if (!aspiration) {
        return {
          statusCode: 404,
          statusMessage: "Aspiration not found",
        };
      }
      return {
        statusCode: 200,
        statusMessage: "Aspiration found",
        data: {
          aspirations: aspiration.map((aspiration) => ({
            ...aspiration.toObject(),
            from: aspiration.anonymous ? undefined : aspiration.from,
          })),
          length,
        },
      };
    } catch (error: any) {
      console.log(error);
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || "Internal Server Error",
      });
    }
  }
);
