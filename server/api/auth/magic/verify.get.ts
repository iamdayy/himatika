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
    const role = decoded.role || 'member'; // Default to member for older tokens without role

    let targetRedirect = '/profile';
    let sessionPayload: any = {};
    let auditLogUser: Types.ObjectId | null = null;
    let auditLogDetails: any = { method: 'magic-link' };

    if (role === 'member') {
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
        
        sessionPayload = { user: user._id as Types.ObjectId };
        auditLogUser = member._id;
        auditLogDetails.username = user.username;
        targetRedirect = '/profile';
    } else if (role === 'guest') {
        // Find guest
        const { GuestModel } = await import("~~/server/models/GuestModel");
        const guest = await GuestModel.findOne({ email });
        if (!guest) {
            throw createError({ statusCode: 404, statusMessage: "Guest not found" });
        }
        
        sessionPayload = { guest: guest._id as Types.ObjectId };
        auditLogUser = null; // Guests are not members, so we don't log them in AuditLog using member reference
        auditLogDetails.email = guest.email;
        targetRedirect = '/guest/dashboard';
    } else {
        throw createError({ statusCode: 400, statusMessage: "Invalid role in token" });
    }

    // Generate Session Tokens
    const accessToken = jwt.sign(sessionPayload, getSecretKey(), {
      expiresIn: "1d",
    });
    const refreshToken = jwt.sign(sessionPayload, getSecretKey(), {
      expiresIn: "90d",
    });

    // Set Session
    await setSession({
      token: accessToken,
      refreshToken,
      ...sessionPayload
    });

    // Audit Log (Only for members for now)
    if (auditLogUser) {
        const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
        await AuditLogModel.create({
            action: 'LOGIN',
            user: auditLogUser,
            ip: ip,
            details: auditLogDetails,
            target: 'Auth'
        });
    }

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

    return sendRedirect(event, targetRedirect);

  } catch (error: any) {
    const message = error.message || "Login failed";
    return sendRedirect(event, `/login?error=${encodeURIComponent(message)}`);
  }
});
