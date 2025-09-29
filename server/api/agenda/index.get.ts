import { AgendaModel } from "~~/server/models/AgendaModel";
import { DocModel } from "~~/server/models/DocModel";
import { PhotoModel } from "~~/server/models/PhotoModel";
import { VideoModel } from "~~/server/models/VideoModel";
import { IMember } from "~~/types";
import { IReqAgendaQuery } from "~~/types/IRequestPost";
import { IAgendaResponse, IError } from "~~/types/IResponse";

/**
 * Handles GET requests for agenda data.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<Event | Event[]>} The event data or an array of agendas.
 * @throws {H3Error} If an error occurs during the process.
 */
export default defineEventHandler(
  async (event): Promise<IAgendaResponse | IError> => {
    try {
      const {
        id,
        page,
        perPage,
        sort,
        order,
        search,
        showMissed,
        category,
        tags,
      } = getQuery<IReqAgendaQuery>(event);
      // Fetch multiple agendas based on user roles
      const user = event.context.user;
      const roles: string[] = ["Public"];
      const auth = checkAuth(event);
      if (auth) {
        roles.push("Member");
        if (event.context.organizer) {
          roles.push("Organizer");
        }
      }
      if (id) {
        // Fetch a single agenda by ID
        const eventData = await AgendaModel.findById(id, {})
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
            match: {
              $or: [
                { signs: { $exists: false } }, // Kondisi 1: Array tidak ada (dianggap kosong)
                { signs: { $exists: true, $size: 0 } }, // Kondisi 2: Array ada, tapi kosong
                {
                  signs: {
                    $exists: true,
                    $not: { $size: 0 }, // Array ada dan tidak kosong
                    $elemMatch: { signed: true }, // Setidaknya satu elemen memiliki signed: true
                  },
                },
              ],
            },
            model: DocModel,
          })
          .exec();

        if (!eventData) {
          throw createError({
            statusCode: 404,
            statusMessage: "Agenda not found",
          });
        }

        if (!roles.includes(eventData.configuration.canSee as string)) {
          throw createError({
            statusCode: 403,
            statusMessage: "You do not have permission to view this agenda",
          });
        }

        // Permission to see participants
        if (
          !roles.includes(eventData.configuration.canSeeRegistered as string)
        ) {
          eventData.participants = [];
        }
        // filter committee not approved if user is not committee or organizer
        if (
          !event.context.organizer ||
          !eventData.committees?.some(
            (c) =>
              (c.member as IMember | undefined)?.NIM === user?.member.NIM &&
              c.approved
          )
        ) {
          eventData.committees = eventData.committees?.filter(
            (member) =>
              member.approved ||
              (member.member as IMember | undefined)?.NIM === user?.member.NIM
          );
        }
        return {
          statusCode: 200,
          statusMessage: "Agenda found",
          data: {
            agenda: eventData,
          },
        };
      }

      let query: any = {
        "configuration.canSee": { $in: roles },
      };
      let skip: number = (page - 1) * perPage;
      let limit: number = perPage;
      if (page == 0 && perPage == 0) {
        skip = 0;
        limit = 0;
      }
      let sortOpt: any = {};

      if (search) {
        query = {
          ...query,
          $or: [{ title: { $regex: search, $options: "i" } }],
        };
      }
      if (!showMissed || showMissed === "false") {
        query = {
          ...query,
          "date.start": {
            $gte: new Date(Date.now()),
          },
        };
      }
      if (tags) {
        query = {
          ...query,
          tags: { $in: tags },
        };
      }
      if (category) {
        query = {
          ...query,
          category: category,
        };
      }
      if (sort && order) {
        sortOpt = {
          [sort]: order === "asc" ? 1 : -1,
        };
      }
      const length = await AgendaModel.countDocuments(query);
      const agendas = await AgendaModel.find(query)
        .populate({
          path: "photos",
          model: PhotoModel,
        })
        .skip(skip || 0)
        .limit(limit || 0)
        .sort(sortOpt);
      if (!agendas) {
        throw createError({
          statusCode: 400,
          message: "No agendas found",
        });
      }
      return {
        statusCode: 200,
        statusMessage: "Agendas found",
        data: {
          agendas,
          length,
        },
      };
    } catch (error: any) {
      return {
        statusCode: error.statusCode || 500,
        statusMessage:
          error.message ||
          "An unexpected error occurred while fetching agenda data",
      };
    }
  }
);
