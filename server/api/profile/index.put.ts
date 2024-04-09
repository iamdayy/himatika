import { IProfile } from "~/types";

export default defineEventHandler(async (event) => {
    try {
        const { NIM } = getQuery(event);
        const body = await readBody<IProfile>(event);
        const profile = await ProfileModel.findOneAndUpdate({ NIM }, body);
        console.log(profile);
        return profile;
    } catch (error) {
        return error;
    }
})