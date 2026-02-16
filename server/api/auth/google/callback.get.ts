import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { AuditLogModel } from "~~/server/models/AuditLogModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { UserModel } from "~~/server/models/UserModel";
import { getGoogleUser } from "~~/server/utils/googleAuth";
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
  const code = query.code as string;
  const config = useRuntimeConfig();

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing authorization code",
    });
  }

  try {
    const redirectUri = `${config.public.public_uri}/api/auth/google/callback`;
    const googleUser = await getGoogleUser(code, redirectUri);

    // Find member by email
    const member = await MemberModel.findOne({ email: googleUser.email });
    
    if (!member) {
       throw createError({
        statusCode: 403,
        statusMessage: "Email not associated with any member",
        data: {
            message: "Email not found in member database. Please contact administrator.",
        }
      });
    }

    if (member.status !== 'active') { // Check if member is active? Signin.post.ts checks verified on User and status on member potentially?
       // Signin checks: user?.verified (boolean)
       // Let's adhere to signin.post.ts logic as much as possible but for OAuth we might skip "verified" check if we trust Google's email verification?
       // Actually `signin.post.ts` checks `user.verified`.
       // If we create a new user, we should probably set verified=true since it came from Google.
    }

    // Find or create user
    let user = await UserModel.findOne({ member: member });
    
    if (!user) {
        // Create a new user for this member if one doesn't exist
        // We need a username and password. 
        // Username: use email or part of email? Or NIM?
        // Password: random string (they can reset it later, or just login via Google always)
        
        user = new UserModel({
            username: member.NIM.toString(), // Default username to NIM
            password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8), // Random password
            member: member._id,
            verified: true, // Auto-verify since we trust Google
            token: "",
            key: ""
        });
        await user.save();
    } else {
        // If user exists, but verified is false, maybe update it?
        if (!user.verified && googleUser.email_verified) {
            user.verified = true;
            await user.save();
        }
    }

    // Generate Tokens (Same as signin.post.ts)
    const token = jwt.sign({ user: user._id }, getSecretKey(), {
      expiresIn: "1d",
    });
    const refreshToken = jwt.sign({ user: user._id }, getSecretKey(), {
      expiresIn: "90d",
    });

    // Set Session
    await setSession({
      token,
      refreshToken,
      user: user._id as Types.ObjectId,
    });

    // Audit Log
    const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
    await AuditLogModel.create({
        action: 'LOGIN',
        user: member._id, // AuditLog uses Member ID based on signin.post.ts:85 `user.member`
        ip: ip,
        details: { username: user.username, method: 'google' },
        target: 'Auth'
    });

    // Redirect to profile with tokens in query? 
    // OR set cookies directly here?
    // nuxt-auth's `local` provider usually expects the client to receive the token and save it.
    // However, for OAuth redirect flow, the server must pass the token back to the client.
    
    // METHOD: Set cookies that `nuxt-auth` (or our custom logic) can read?
    // `nuxt-auth` uses `auth.token` cookie by default.
    // nuxt.config.ts says: cookieName: "auth.token"
    
    setCookie(event, 'auth.token', token, {
        maxAge: 60 * 60 * 24, // 1 day
        secure: process.env.NODE_ENV === "production",
        sameSite: 'lax'
    });
    
    // We typically also need to set the state for specific provider if using authjs, but here we are "simulating" local provider login.
    // But `useAuth` hook in frontend might not pick it up automatically unless we reload or init session.
    // One common trick: Redirect to a page that calls `signIn` with credentials? No we have the token.
    // Just setting the cookie might be enough if `useAuth` checks it.
    // "token.type": "Bearer" -> The cookie value should be just the token? or "Bearer <token>"?
    // Usually nuxt-auth stores just the token in cookie, but sends as Bearer header.
    
    // ALSO: refresh token
    setCookie(event, 'auth.refresh-token', refreshToken, {
        maxAge: 60 * 60 * 24 * 90, // 90 days
        secure: process.env.NODE_ENV === "production",
        sameSite: 'lax'
    });

    return sendRedirect(event, '/profile');

  } catch (error: any) {
    console.error("Google OAuth Error:", error);
    // Redirect to login with error
    const message = error.data?.message || error.statusMessage || "Login failed";
    return sendRedirect(event, `/login?error=${encodeURIComponent(message)}`);
  }
});
