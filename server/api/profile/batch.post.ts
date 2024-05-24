import { ProfileModel } from "~/server/models/ProfileModel";
import { IProfile } from "~/types";

export default defineEventHandler(async (event) => {
  try {
    const user = await ensureAuth(event);
    if (!user.profile.isAdministrator || !user.profile.isDepartement) {
      throw createError({
        statusCode: 403,
        statusMessage:
          "You must be administrator or departement to use this endpoint",
      });
    }
    const body = await readBody<IProfile[]>(event);
    const saved = await ProfileModel.collection.insertMany(body);
    if (saved.insertedCount == 0) {
      throw createError({
        statusCode: 500,
        message: "Owhhh no data saved yet",
      });
    }
    return {
      statusCode: 200,
      statusMessage: `Saved new ${saved.insertedCount} Collegers`,
    };
  } catch (error: any) {
    return error;
  }
});
