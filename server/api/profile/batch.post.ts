import { IProfile } from "~/types";

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<IProfile[]>(event);
        const saved = await ProfileModel.collection.insertMany(body)
        if (saved.insertedCount == 0) {
            throw createError({
                statusCode: 500,
                message: "Owhhh no data saved yet"
            })
        }
        return {
            statusCode: 200,
            statusMessage: `Saved new ${saved.insertedCount} Collegers`
        }
    } catch (error: any) {
        return error;
    }
})