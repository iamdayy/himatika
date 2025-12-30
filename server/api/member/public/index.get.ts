import { MemberModel } from "~~/server/models/MemberModel";
import { IMember } from "~~/types";
import { IReqMemberQuery } from "~~/types/IRequestPost";
import { IMemberResponse } from "~~/types/IResponse";

export default defineCachedEventHandler(
  async (event): Promise<IMemberResponse> => {
    try {
      const user = event.context.user;
      if (!user) {
        throw createError({
          statusCode: 403,
          statusMessage: "You must be logged in to access this",
        });
      }
      const { search } = getQuery<IReqMemberQuery>(event);
      let query: any = {
        status: "active",
      };
      if (search) {
        query = {
          ...query,
          $or: [
            { fullName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { class: { $regex: search, $options: "i" } },
          ],
        };
      }
      const members = await MemberModel.find(
        query,
        {},
        { autopopulate: false }
      );
      return {
        statusCode: 200,
        statusMessage: "Members fetched",
        data: {
          members: members as IMember[],
        },
      };
    } catch (error: any) {
      throw createError({
        statusCode: error.statusCode || 500,
        message: error.message || "An error occurred while fetching members",
      });
    }
  },
  {
    maxAge: 60 * 60, // Cache selama 1 Jam
    name: "member-public-cache",
    swr: true,
  }
);
