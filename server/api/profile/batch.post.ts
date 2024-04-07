import { IProfile } from "~/types";

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<IProfile[]>(event);
        const result = await ProfileModel.collection.insertMany(body)
        return {
            ok: true,
            result
        }
    } catch (error: any) {
        return error;
    }
})