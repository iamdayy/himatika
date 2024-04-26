import { Types } from "mongoose";

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);
        if (query.NIM) {
            const id = await getIdByNim(query.NIM as number)
            const departement = await DepartementModel.findOne({ profile: id });
            return departement;
        }
        const departements = await DepartementModel.find();
        return departements;
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