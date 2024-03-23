import { UserModel } from "../../models/UserModel";
import JWT, { JwtPayload } from "jsonwebtoken"
export default defineEventHandler(async (event) => {
    try {
        const cookie = getCookie(event, 'UserCanAccess');
        if (!cookie) {
            throw createError({
                statusCode: 401,
                message: "You not authorize"
            })
            
        }
        const jwt = JWT.verify(cookie, "HimatikaUser") as JwtPayload;
        const user = await UserModel.findOne({ username: jwt.username });
        console.log
        return user;
    } catch (error) {
        return createError({
            statusCode: 500,
            message: "Our system is error"
        });
    }
})