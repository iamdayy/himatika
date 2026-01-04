import { MemberModel } from "~~/server/models/MemberModel";
import OrganizerModel from "~~/server/models/OrganizerModel";
import { IOrganizer } from "~~/types";
import type { IOrganizerResponse } from "~~/types/IResponse";

export default defineCachedEventHandler(
  async (event): Promise<IOrganizerResponse> => {
    try {
      const query = getQuery<{ NIM?: number; period: string }>(event);

      if (query.NIM) {
        const id = await getIdByNim(query.NIM as number);
        const organizer = await OrganizerModel.findOne({
          $or: [
            { "dailyManagement.member": id },
            { "department.coordinator": id },
            { "department.members.member": id },
          ],
        });
        return {
          statusCode: 200,
          statusMessage: "Organizer fetched successfully.",
          data: {
            organizer: organizer as IOrganizer,
          },
        };
      }
      if (query.period) {
        const [startYear, endYear] = query.period.split("-").map(Number);

        const organizer = await OrganizerModel.findOne({
          $expr: {
            $and: [
              { $gte: [{ $year: "$period.start" }, startYear] },
              { $lte: [{ $year: "$period.end" }, endYear] },
            ],
          },
        });

        if (!organizer) {
          throw createError({
            statusCode: 404,
            statusMessage: "Organizer not found",
          });
        }
        return {
          statusCode: 200,
          statusMessage: "Organizer fetched successfully.",
          data: {
            organizer: organizer,
          },
        };
      }
      const organizers = await OrganizerModel.find().sort("period.start");
      return {
        statusCode: 200,
        statusMessage: "Organizer fetched successfully.",
        data: {
          organizers: organizers,
        },
      };
    } catch (error: any) {
      return {
        statusCode: error.statusCode || 500,
        statusMessage: error.message || "Internal server error.",
      };
    }
  },
  {
    maxAge: 60 * 60 * 24, // Cache selama 1 Hari
    name: "organizer-cache",
    swr: true,
  }
);

const getIdByNim = async (NIM: number): Promise<unknown> => {
  try {
    const member = await MemberModel.findOne({ NIM });
    if (!member) {
      throw createError({
        statusCode: 404,
        message: `Member not found for NIM: ${NIM}`,
      });
    }
    return member._id;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message:
        error.message ||
        `An error occurred while fetching member for NIM: ${NIM}`,
    });
  }
};
