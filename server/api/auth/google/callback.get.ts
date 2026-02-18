import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { AuditLogModel } from "~~/server/models/AuditLogModel";
import { GuestModel } from "~~/server/models/GuestModel";
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
    
    if (member) {
      if (member.status !== 'active') { 
         // If member is not active, try to find if they are a guest
         const guest = await GuestModel.findOne({ email: googleUser.email });
         if (guest) {
             // Generate Tokens (Guest)
            const token = jwt.sign({ guest: guest._id }, getSecretKey(), {
                expiresIn: "1d",
            });
            const refreshToken = jwt.sign({ guest: guest._id }, getSecretKey(), {
                expiresIn: "30d",
            });

            // Set Session (Guest)
            await setSession({
                token,
                refreshToken,
                guest: guest._id as Types.ObjectId,
            });
            
            setCookie(event, 'auth.token', token, {
                maxAge: 60 * 60 * 24, 
                secure: process.env.NODE_ENV === "production",
                sameSite: 'lax'
            });
             setCookie(event, 'auth.refresh-token', refreshToken, {
                maxAge: 60 * 60 * 24 * 30, 
                secure: process.env.NODE_ENV === "production",
                sameSite: 'lax'
            });

            return sendRedirect(event, '/guest/dashboard');
         }
      }

      // Find or create user
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
          if (!user.verified && googleUser.email_verified) {
              user.verified = true;
              await user.save();
          }
      }

      // Generate Tokens (User)
      const token = jwt.sign({ user: user._id }, getSecretKey(), {
        expiresIn: "1d",
      });
      const refreshToken = jwt.sign({ user: user._id }, getSecretKey(), {
        expiresIn: "90d",
      });

      // Set Session (User)
      await setSession({
        token,
        refreshToken,
        user: user._id as Types.ObjectId,
      });

      // Audit Log (User)
      const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
      await AuditLogModel.create({
          action: 'LOGIN',
          user: member._id,
          ip: ip,
          details: { username: user.username, method: 'google' },
          target: 'Auth'
      });
      
      setCookie(event, 'auth.token', token, {
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

    } else {
      // Check for Guest
      const guest = await GuestModel.findOne({ email: googleUser.email });

      if (guest) {
        // Generate Tokens (Guest)
        const token = jwt.sign({ guest: guest._id }, getSecretKey(), {
            expiresIn: "1d",
        });
        const refreshToken = jwt.sign({ guest: guest._id }, getSecretKey(), {
            expiresIn: "30d",
        });

        // Set Session (Guest)
        await setSession({
            token,
            refreshToken,
            guest: guest._id as Types.ObjectId,
        });

        // Audit Log (Guest - simplified or skipped depending on model)
        // AuditLog usually links to Member. We might need to update AuditLog to support Guest or just skip / store string.
        // For now, let's skip or try to conform.
        
        setCookie(event, 'auth.token', token, {
            maxAge: 60 * 60 * 24, 
            secure: process.env.NODE_ENV === "production",
            sameSite: 'lax'
        });
        setCookie(event, 'auth.refresh-token', refreshToken, {
            maxAge: 60 * 60 * 24 * 30, 
            secure: process.env.NODE_ENV === "production",
            sameSite: 'lax'
        });

        return sendRedirect(event, '/guest/dashboard');
      }

      // Neither Member nor Guest
      throw createError({
        statusCode: 403,
        statusMessage: "Email not registered",
        data: {
            message: "Email not associated with any account (Member or Guest). Please register first.",
        }
      });
    }

  } catch (error: any) {
    console.error("Google OAuth Error:", error);
    // Redirect to login with error
    const message = error.data?.message || error.statusMessage || "Login failed";
    return sendRedirect(event, `/login?error=${encodeURIComponent(message)}`);
  }
});
