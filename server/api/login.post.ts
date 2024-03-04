import { UserModel } from "~/server/models/UserModel";
import jwt from "jsonwebtoken";

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);
        console.log(body)
        const user = await UserModel.findOne({ username: body.username });
        console.log(user)
        if (!user) {
            throw createError({
                statusCode: 404,
                message: "User not found"
            });
        }
        const passMatch = await user?.verifyPassword(body.password, user.password);
        if (!passMatch) {
            throw createError({
                statusCode: 400,
                message: "Please check your password"
            });
        }
        const jwt_payload = {
            username: user.username
        }
        const token = jwt.sign(jwt_payload, "SimitnuPro", {
            expiresIn: "10h",
        });
        const token_re = jwt.sign(jwt_payload, "SimitnuPro", {
            expiresIn: "30d"
        });
        user.token = token_re;
        user.save();
        return {
            token,
            token_re,
            user
        };
    } catch (error: any) {
        return createError({
            statusCode: error.statusCode,
            message: error.message
        });
    }
})