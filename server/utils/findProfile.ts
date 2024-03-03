import { ProfileModel } from "../models/ProfileModel";
import type { Types } from "mongoose";
export const findProfileByNim = async (nim: number) : Promise<Types.ObjectId | false> => {
    try {
        const profile = await ProfileModel.findOne({ NIM: nim });
        if (!profile) {
            return false;
        }
        return profile?._id;
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode,
            message: error.message
        });
    }
}

export const findProfileAndMarkRegister = async (id: Types.ObjectId) => {
    try {
        const profile = await ProfileModel.findById(id);
        if (!profile) {
            throw createError({
                statusCode: 404,
                message: "Profile not found"
            });
        }
        profile.isRegistered = true;
        profile.save();
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode,
            message: error.message
        });
    }
}