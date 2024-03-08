import { UserModel } from "~/server/models/UserModel";
import jwt from "jsonwebtoken";
import { ILoginResponse } from "~/types/IResponse";

export default defineEventHandler(async (event): Promise<ILoginResponse> => {
    const body = await readBody(event);
    const user = await UserModel.findOne({ username: body.username });
    if (!user) {
        throw createError({
            statusCode: 401,
            message: "User not found"
        });
    }
    const passMatch = await user?.verifyPassword(body.password, user.password);
    if (!passMatch) {
        throw createError({
            statusCode: 401,
            message: "Please check your password"
        });
    }
    const jwt_payload = {
        username: user.username
    }
    const token = jwt.sign(jwt_payload, "HimatikaUser", {
        expiresIn: "10h",
    });
    const token_re = jwt.sign(jwt_payload, "HimatikaUser", {
        expiresIn: "30d"
    });
    user.token = token_re;
    setCookie(event,'UserCanRrefresh', token_re);
    setCookie(event,'UserCanAccess', token);
    user.save();
    return {
        token,
        token_re,
        user
    };
})