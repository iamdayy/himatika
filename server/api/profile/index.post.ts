import { ProfileModel } from "~/server/models/ProfileModel";
import type { IReqProfile } from "~/types/IRequestPost"
export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<IReqProfile>(event);

        const profile = new ProfileModel(body);
        const saved = profile.save();
        if (!saved) {
            throw createError({
                statusCode: 500,
                message: "Owhhh data not saved yet"
            })
        }
        return saved;
    } catch (error: any) {
        return createError({
            statusCode: error.statusCode,
            message: error.message
        });
    }
});