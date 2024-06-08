import { ProfileModel } from "~/server/models/ProfileModel";
import type { IReqProfile } from "~/types/IRequestPost";
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
    const body = await readBody<IReqProfile>(event);

    const profile = new ProfileModel(body);
    const saved = profile.save();
    if (!saved) {
      throw createError({
        statusCode: 500,
        message: "Owhhh data not saved yet",
      });
    }
    return {
      statusCode: 200,
      statusMessage: `Profile ${profile.NIM} Saved!`,
    };
  } catch (error: any) {
    return createError({
      statusCode: error.statusCode,
      message: error.message,
    });
  }
});
