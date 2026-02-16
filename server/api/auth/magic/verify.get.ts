import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { AuditLogModel } from "~~/server/models/AuditLogModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { UserModel } from "~~/server/models/UserModel";
import { setSession } from "~~/server/utils/Sessions";

const getSecretKey = () => {
  const secretKey = useRuntimeConfig().jwtSecret;
  if (!secretKey) {
    throw new Error("JWT secret key is not configured.");
  }
  return secretKey;
};

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const token = query.token as string;

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing magic token",
    });
  }

  try {
    // Verify Token
    const decoded = jwt.verify(token, getSecretKey()) as any;
    
    if (decoded.type !== 'magic' || !decoded.email) {
        throw createError({ statusCode: 400, statusMessage: "Invalid token type" });
    }

    const email = decoded.email;

    // Find member
    const member = await MemberModel.findOne({ email });
    if (!member) {
        throw createError({ statusCode: 404, statusMessage: "Member not found" });
    }

    // Find or create user (Same logic as Google OAuth)
    let user = await UserModel.findOne({ member: member });
    
    if (!user) {
         user = new UserModel({
            username: member.NIM.toString(),
            password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8),
            member: member._id,
            verified: true,
            token: "",
            key: ""
        });
        await user.save();
    } else {
         if (!user.verified) {
            user.verified = true;
            await user.save();
        }
    }

    // Generate Session Tokens
    const accessToken = jwt.sign({ user: user._id }, getSecretKey(), {
      expiresIn: "1d",
    });
    const refreshToken = jwt.sign({ user: user._id }, getSecretKey(), {
      expiresIn: "90d",
    });

    // Set Session
    await setSession({
      token: accessToken,
      refreshToken,
      user: user._id as Types.ObjectId,
    });

    // Audit Log
    const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
    await AuditLogModel.create({
        action: 'LOGIN',
        user: member._id,
        ip: ip,
        details: { username: user.username, method: 'magic-link' },
        target: 'Auth'
    });

    // Set Cookies
    setCookie(event, 'auth.token', accessToken, {
        maxAge: 60 * 60 * 24,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'lax'
    });
    
    setCookie(event, 'auth.refresh-token', refreshToken, {
        maxAge: 60 * 60 * 24 * 90,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'lax'
    });

    return sendRedirect(event, '/profile');

  } catch (error: any) {
    const message = error.message || "Login failed";
    return sendRedirect(event, `/login?error=${encodeURIComponent(message)}`);
  }
});
