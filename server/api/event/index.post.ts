import { EventModel } from "~/server/models/EventModel";
import { ProfileModel } from "~/server/models/ProfileModel";
import { IReqEvent } from "~/types/IRequestPost";

export default defineEventHandler(async (event) => {
  try {
    const user = await ensureAuth(event);
    if (!user.profile.isAdministrator && !user.profile.isDepartement) {
      throw createError({
        statusCode: 403,
        statusMessage:
          "You must be administrator or departement to use this endpoint",
      });
    }
    const body = await readBody<IReqEvent>(event);
    const committees = body.committee?.map(async (committe) => {
      try {
        const c = await ProfileModel.findOne({ NIM: committe.user });
        if (!c) {
          throw createError({
            statusCode: 400,
            message: "Owwhhh user not found",
          });
        }
        return {
          job: committe.job,
          user: c._id,
        };
      } catch (error: any) {
        throw createError({
          statusCode: error.statusCode,
          message: error.message,
        });
      }
    });
    const ev = new EventModel({
      ...body,
      committee: await Promise.all(committees!),
    });
    const saved = await ev.save();
    if (!saved) {
      throw createError({
        statusCode: 400,
        message: "Owhhh data not saved yet",
      });
    }
    return saved;
  } catch (error: any) {
    return createError({
      statusCode: error.statusCode,
      message: error.message,
    });
  }
});
