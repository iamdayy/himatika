import { UserModel } from "~/server/models/UserModel";
import { IReqRegister } from "~/types/IRequestPost";
import { findProfileAndMarkRegister, findProfileByNim } from "../utils/findProfile";
import { IUser } from "~/types";

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<IReqRegister>(event);
        const profileId = await findProfileByNim(body.NIM);
        if (!profileId) {
            throw createError({
                statusCode: 500,
                message: "Owhhh you not registered yet"
            })
        }
        const form = {
            ...body,
            profile: profileId
        }
        const user = new UserModel(form);
        const registered = await user.save();
        await findProfileAndMarkRegister(profileId);
        if (!registered) {
            throw createError({
                statusCode: 500,
                message: "Owhhh you not registered yet"
            })
        }
        return registered;
    } catch (error: any) {
        return createError({
            statusCode: error.statusCode,
            message: error.message
        });
    }
})