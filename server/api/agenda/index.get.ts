import { AgendaModel } from "~~/server/models/AgendaModel";
import { PhotoModel } from "~~/server/models/PhotoModel";
import { IReqAgendaQuery } from "~~/types/IRequestPost";
import { IAgendaResponse, IError } from "~~/types/IResponse";

/**
 * Handles GET requests for agenda data.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<Event | Event[]>} The event data or an array of agendas.
 * @throws {H3Error} If an error occurs during the process.
 */
export default defineCachedEventHandler(
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
      if (user) {
        roles.push("Member");
        if (event.context.organizer) {
          roles.push("Organizer");
        }
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
  },
  {
    maxAge: 60 * 5, // Cache selama 5 Menit
    name: "agenda-cache",
    swr: true,
  }
);
