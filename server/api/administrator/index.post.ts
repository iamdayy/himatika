import { IAdministrator } from "~/types";
import { Types } from "mongoose";
export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<IAdministrator>(event);
        const administrator = new AdministratorModel({
            chairman: await getIdByNim(body.chairman as number),
            viceChairman: await getIdByNim(body.viceChairman as number),
            secretary: await getIdByNim(body.secretary as number),
            viceSecretary: await getIdByNim(body.viceSecretary as number),
            treasurer: await getIdByNim(body.treasurer as number),
            viceTreasurer: await getIdByNim(body.viceTreasurer as number),
            period: body.period
        });
        const added = await administrator.save();
        return added;
    } catch (error: any) {
        return createError({
            statusCode: error.statusCode,
            message: error.message
        });
    }
});

const getIdByNim = async (NIM: number): Promise<Types.ObjectId> => {
    try {
        const profile = await ProfileModel.findOne({ NIM });
        return profile?._id;
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode,
            message: error.message
        });
    }
}