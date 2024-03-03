import { ProfileModel } from "~/server/models/ProfileModel";
export default defineEventHandler(async (event) => {
    try {
        const profiles = await ProfileModel.find();
        return profiles;
    } catch (error: any) {
        return createError({
            statusCode: error.statusCode,
            message: error.message
        });
    }
});