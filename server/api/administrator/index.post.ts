import { AdministratorModel } from "~/server/models/AdministratorModel";
import { ProfileModel } from "~/server/models/ProfileModel";
import { IAdministrator, IAdministratorMember } from "~/types";
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
    const body = await readBody<IAdministrator>(event);
    await checkExistAdministrator(body.period.start, body.period.end);
    const AdministratorMembers = await Promise.all(
      body.AdministratorMembers.map(
        async (member) =>
          ({
            ...member,
            profile: await getIdByNim(member.profile as number),
          } as IAdministratorMember)
      )
    );
    const administrator = new AdministratorModel({
      period: body.period,
      AdministratorMembers,
    });
    const saved = await administrator.save();
    if (!saved) {
      return {
        statusCode: 400,
        statusMessage: `Failed to add new Administrator Period ${administrator.period.start.getFullYear()} - ${administrator.period.end.getFullYear()}`,
      };
    }
    return {
      statusCode: 200,
      statusMessage: `Success to add new Administrator Period ${administrator.period.start.getFullYear()} - ${administrator.period.end.getFullYear()}`,
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

const checkExistAdministrator = async (start: Date, end: Date) => {
  try {
    const administrator = await AdministratorModel.findOne({
      "period.start": { $gte: start },
      "period.end": { $lte: end },
    });
    if (administrator) {
      throw createError({
        statusCode: 400,
        statusMessage: "Cannot add new administrator before period end",
      });
    }
    return;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode,
      message: error.message,
    });
  }
};
