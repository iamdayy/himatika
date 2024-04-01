import { ISetSessionParams } from "~/types/IParam";
import { SessionModel } from "../models/SessionModel"
import { H3Error } from "h3"
import jwt from "jsonwebtoken";
export const getSession = async (payload: string) => {
    try {
        const session = jwt.verify(payload, "HimatikaUser") as jwt.JwtPayload;
        if (!session) {
            throw createError({
                statusMessage: "Unauthenticated!",
                statusCode: 401
            })
        }
        const user = await UserModel.findById(session.user);
        return user;
    } catch (error: any) {
        return error;
    }
}

export const setSession = async (payload: ISetSessionParams): Promise<true | H3Error> => {
    try {
        const createdSession = await SessionModel.create(payload);
        if (createdSession) {
            throw createError({
                statusCode: 500,
                statusMessage: "Ouh error on system"
            })
        }
        return true;
    } catch (error: any) {
        return error;
    }
}
export const clearSession = async (payload: string) => {
    try {
        const session = jwt.verify(payload, "HimatikaUser") as jwt.JwtPayload;
        if (!session) {
            throw createError({
                statusMessage: "Unauthenticated!",
                statusCode: 401
            })
        }
        const s = await SessionModel.findOne({ user: session.user });
        const deleted = s?.deleteOne();
        return deleted;
    } catch (error: any) {
        return error;
    }
}