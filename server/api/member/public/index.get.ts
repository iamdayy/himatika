import { MemberModel } from "~~/server/models/MemberModel";
import { IMember } from "~~/types";
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
      const members = await MemberModel.find(
        {
          status: "active",
        },
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
