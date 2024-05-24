import { AdministratorModel } from "~/server/models/AdministratorModel";
import { ProfileModel } from "~/server/models/ProfileModel";
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    if (query.NIM) {
      const id = await getIdByNim(query.NIM as number);
      const administrator = await AdministratorModel.findOne({
        "AdministratorMembers.profile": id,
      });
      return administrator;
    }
    const administrators = await AdministratorModel.find();
    return administrators;
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
