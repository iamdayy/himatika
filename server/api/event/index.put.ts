import { EventModel } from "~/server/models/EventModel";

export default defineEventHandler(async (ev) => {
  try {
    const user = await ensureAuth(ev);
    if (!user.profile.isAdministrator && !user.profile.isDepartement) {
      throw createError({
        statusCode: 403,
        statusMessage:
          "You must be administrator or departement to use this endpoint",
      });
    }
    const { id } = getQuery(ev);
    const body = await readBody(ev);
    const event = await EventModel.findById(id);
    if (!event) {
      throw createError({
        statusCode: 404,
        statusMessage: "The event is'nt found",
      });
    }
    event.title = body.title;
    event.at = body.at;
    event.date = body.date;
    event.canSee = body.canSee;
    event.description = body.description;
    event.canRegister = body.canRegister;
    event.save();
    return {
      statusCode: 200,
      statusMessage: `Event ${event.title} updated`,
    };
  } catch (error: any) {
    return createError({
      statusCode: error.statusCode,
      message: error.message,
    });
  }
});
