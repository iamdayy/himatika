import { ProfileModel } from "~/server/models/ProfileModel";
import { IReqProfileQuery } from "~/types/IRequestPost";
export default defineEventHandler(async (event) => {
    try {
        const { NIM, perPage, page } = getQuery<IReqProfileQuery>(event);
        const user = await ensureAuth(event);
        if (!user) {
            throw createError({
                statusCode: 403,
                statusMessage: "You must be logged in to access this"
            });
        }
        
        if (!user.profile.isDepartement || !user.profile.isAdministrator) {
            throw createError({
                statusCode: 403,
                statusMessage: "You must be admin / departement to access this"
            });
        }
        if (NIM) {
            const profile = await ProfileModel.findOne({ NIM });
            return profile;
        }
        const length = await ProfileModel.countDocuments();
        const profiles = await ProfileModel.find().skip((page - 1) * perPage)
        .limit(perPage);
        return {
            profiles,
            length
        };
    } catch (error: any) {
        return createError({
            statusCode: error.statusCode,
            message: error.message
        });
    }
});