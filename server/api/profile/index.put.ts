import { ProfileModel } from "~/server/models/ProfileModel";
import { IProfile } from "~/types";

export default defineEventHandler(async (event) => {
  try {
    const { NIM } = getQuery(event);
    const body = await readBody<IProfile>(event);
    const profile = await ProfileModel.findOneAndUpdate({ NIM }, body);
    if (!profile) {
      throw createError({
        statusCode: 404,
        message: "Profile not found",
      });
    }
    return {
      statusCode: 200,
      statusMessage: `Profile ${profile.NIM} updated`,
    };
  } catch (error: any) {
    return createError({
      statusCode: error.statusCode,
      message: error.message,
    });
  }
});
