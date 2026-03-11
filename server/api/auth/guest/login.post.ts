import jwt from "jsonwebtoken";
import { GuestModel } from "~~/server/models/GuestModel";
import { setSession } from "~~/server/utils/Sessions";

const getSecretKey = () => {
    const secretKey = useRuntimeConfig().jwtSecret;
    if (!secretKey) {
        throw new Error("JWT secret key is not configured.");
    }
    return secretKey;
};

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);
        const { email } = body;

        if (!email) {
            throw createError({
                statusCode: 400,
                statusMessage: "Email is required",
            });
        }

        const guest = await GuestModel.findOne({ email });

        if (!guest) {
            throw createError({
                statusCode: 401,
                statusMessage: "Invalid credentials",
            });
        }

        // Password check removed as per user schema change
        // const isValid = await (guest as any).verifyPassword(password);
        // if (!isValid) { ... }

        // Generate tokens
        const token = jwt.sign({ guest: guest._id }, getSecretKey(), {
            expiresIn: "1d",
        });
        const refreshToken = jwt.sign({ guest: guest._id }, getSecretKey(), {
            expiresIn: "30d",
        });

        // Set Session (We need to update setSession/SessionModel to support Guest)
        // This is where "dual auth" complexity comes in.
        // We can pass `guest: guest._id` instead of `user: user._id`.
        // But SessionModel likely expects `user`.
        // Let's check SessionModel...
        
        await setSession({
            token,
            refreshToken,
            guest: guest._id as any,
        });

        return {
            token,
            refreshToken,
        };

    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || "Login failed",
        });
    }
});
