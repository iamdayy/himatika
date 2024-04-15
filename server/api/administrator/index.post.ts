import { IAdministrator } from "~/types";
import { Types } from "mongoose";
export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<IAdministrator>(event);
        await checkExistAdministrator(body.period.start, body.period.end);
        const administrator = new AdministratorModel({
            chairman: await getIdByNim(body.chairman as number),
            viceChairman: await getIdByNim(body.viceChairman as number),
            secretary: await getIdByNim(body.secretary as number),
            viceSecretary: await getIdByNim(body.viceSecretary as number),
            treasurer: await getIdByNim(body.treasurer as number),
            viceTreasurer: await getIdByNim(body.viceTreasurer as number),
            period: body.period
        });
        const saved = await administrator.save();
        if (!saved) {
            return {
                statusCode: 400,
                statusMessage: `Failed to add new Administrator Period ${administrator.period.start.getFullYear()} - ${administrator.period.end.getFullYear()}`
            };
        }
        return {
            statusCode: 200,
            statusMessage: `Success to add new Administrator Period ${administrator.period.start.getFullYear()} - ${administrator.period.end.getFullYear()}`
        };
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

const checkExistAdministrator = async (start: Date, end: Date) => {
    try {
        const administrator = await AdministratorModel.findOne({ 'period.start': { '$gte': start }, 'period.end': { '$lte': end } });
        if (administrator) {
            throw createError({
                statusCode: 400,
                statusMessage: "Cannot add new administrator before period end"
            });
            return;
        }
        return;
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode,
            message: error.message
        });
    }
}