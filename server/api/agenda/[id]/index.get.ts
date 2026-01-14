import { AgendaModel } from "~~/server/models/AgendaModel";
import { DocModel } from "~~/server/models/DocModel";
import { PhotoModel } from "~~/server/models/PhotoModel";
import { VideoModel } from "~~/server/models/VideoModel";
import { IMember } from "~~/types";

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    const { id } = event.context.params as { id: string };
    const roles: string[] = ["Public"];
    if (user) {
      roles.push("Member");
      if (event.context.organizer) {
        roles.push("Organizer");
      }
    }
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
    if (!roles.includes(eventData.configuration.canSeeRegistered as string)) {
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
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    });
  }
});
