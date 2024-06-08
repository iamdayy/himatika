import { DepartementModel } from "~/server/models/DepartementModel";
import { ProfileModel } from "~/server/models/ProfileModel";
import { IDepartement } from "~/types";
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
    const body = await readBody<IDepartement>(event);
    const departement = new DepartementModel({
      profile: await getIdByNim(body.profile as number),
      period: body.period,
      departement: body.departement,
    });
    const saved = await departement.save();
    if (!saved) {
      return {
        statusCode: 400,
        statusMessage: `Failed to add new Saved Period ${departement.period.start.getFullYear()} - ${departement.period.end.getFullYear()}`,
      };
    }
    return {
      statusCode: 200,
      statusMessage: `Success to add new Saved Period ${departement.period.start.getFullYear()} - ${departement.period.end.getFullYear()}`,
    };
  } catch (error: any) {
    return createError({
      statusCode: error.statusCode,
      message: error.message,
    });
  }
});

const getIdByNim = async (NIM: number): Promise<unknown> => {
  try {
    const profile = await ProfileModel.findOne({ NIM });
    return profile?._id;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode,
      message: error.message,
    });
  }
};
