import { EventModel } from "~/server/models/EventModel";
import { ProfileModel } from "~/server/models/ProfileModel";

const getNimFromID = async (id: string) => {
  const profile = await ProfileModel.findById(id);

  if (!profile?.NIM) {
    throw createError({
      statusCode: 404,
      statusMessage: "Someone is error",
    });
  }

  return profile.NIM;
};

export default defineEventHandler(async (event) => {
  try {
    const { id } = getQuery(event);
    if (id) {
      const event = await EventModel.findById(id, {}, { autopopulate: false });
      if (!event) {
        throw createError({
          statusCode: 404,
          statusMessage: "Event not found",
        });
      }
      const committee = await Promise.all(
        event?.committee?.map(async (coommitee) => ({
          user: await getNimFromID(coommitee.user as string),
          job: coommitee.job,
        }))!
      );

      return {
        ...event.toJSON(),
        committee,
      };
    }
    const roles: string[] = ["All", "External"];
    const auth = checkAuth(event);
    if (auth) {
      const user = await ensureAuth(event);
      if (user.profile.isAdministrator) {
        if (!roles.includes("Internal")) {
          roles.push("Internal");
        }
        roles.push("Admin");
      }
      if (user.profile.isDepartement) {
        if (!roles.includes("Internal")) {
          roles.push("Internal");
        }
        roles.push("Departement");
      }
    }
    const events = await EventModel.find({ canSee: { $in: roles } });
    if (!events) {
      throw createError({
        statusCode: 400,
        message: "Owhhh data not saved yet",
      });
    }
    return events;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: "Owhhh system error",
    });
  }
});
