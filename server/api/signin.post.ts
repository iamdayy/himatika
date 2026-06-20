import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { z } from "zod";
import { AuditLogModel } from "~~/server/models/AuditLogModel";
import { UserModel, UserPopulateOptions } from "~~/server/models/UserModel";
import { MemberModel } from "../models/MemberModel";
import { setSession } from "../utils/Sessions";

const loginSchema = z.object({
  username: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6),
}).refine((data) => data.username || data.email, {
  message: "Username atau Email wajib diisi",
  path: ["username"],
});

const getSecretKey = () => {
  const secretKey = useRuntimeConfig().jwtSecret;
  if (!secretKey) {
    throw new Error("JWT secret key is not configured.");
  }
  return secretKey;
};

/**
 * Handles user sign-in process.
 */
export default defineEventHandler(async (event) => {
  try {
    const rawBody = await readBody(event);
    const validation = loginSchema.safeParse(rawBody);
    const t = await useTranslationServerMiddleware(event);

    const invalidCredentialsError = createError({
      statusCode: 401,
      statusMessage: t("login_page.invalid_credentials") || "Kredensial tidak valid",
    });

    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validasi gagal",
        data: validation.error.format(),
      });
    }

    const body = validation.data;

    let queryFilter: any = [];
    
    // The frontend sends everything (Username, NIM, Email) in the `username` field
    const inputStr = body.username || body.email || "";
    
    // 1. Always check UserModel.username
    queryFilter.push({ username: inputStr });
    
    // 2. Check if it's an email
    const isEmail = inputStr.includes("@");
    // 3. Check if it's an NIM (all numbers)
    const isNIM = /^\d+$/.test(inputStr);

    let memberCondition: any = [];
    if (isEmail) {
      memberCondition.push({ email: inputStr });
    }
    if (isNIM) {
      memberCondition.push({ NIM: parseInt(inputStr) });
    }

    if (memberCondition.length > 0) {
      const memberFound = await MemberModel.findOne({ $or: memberCondition });
      if (memberFound) {
        queryFilter.push({ member: memberFound._id });
      }
    }

    // Find user and do heavy populate ONCE here
    const user = await UserModel.findOne({ $or: queryFilter })
      .populate(UserPopulateOptions);

    if (!user) {
      throw invalidCredentialsError;
    }
    if (!user.verified) {
      throw createError({
        statusCode: 401,
        statusMessage: t("login_page.email_not_verified"),
        data: { message: t("login_page.verify_email"), name: "email" },
      });
    }

    // Verify password
    const passMatch = await user.verifyPassword(body.password, user.password);
    if (!passMatch) {
      throw invalidCredentialsError;
    }

    // Build LEAN payload for JWT
    let memberPayload = null;
    if (user.member) {
      const m = user.member as any;
      memberPayload = {
        NIM: m.NIM,
        fullName: m.fullName,
        avatar: m.avatar,
        email: m.email,
        status: m.status,
        semester: m.semester,
        class: m.class,
        sex: m.sex,
        phone: m.phone,
        organizer: m.organizer ? { role: m.organizer.role, period: m.organizer.period } : null
      };
    }

    let guestPayload = null;
    if (user.guest) {
        guestPayload = user.guest; 
    }

    const tokenPayload = {
      user: user._id,
      username: user.username,
      member: memberPayload,
      guest: guestPayload
    };

    const token = jwt.sign(tokenPayload, getSecretKey(), {
      expiresIn: "60m", // Stateless JWT with shorter expiry
    });
    
    const refreshToken = jwt.sign({ user: user._id }, getSecretKey(), {
      expiresIn: "90d",
    });

    // Set up session (Only saves refreshToken)
    await setSession({
      refreshToken,
      user: user._id as Types.ObjectId,
    });
    
    // Audit Log
    const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
    await AuditLogModel.create({
        action: 'LOGIN',
        user: user.member || user.guest || user._id,
        ip: ip,
        details: { username: body.username || body.email },
        target: 'Auth'
    });

    return {
      token,
      refreshToken,
    };
  } catch (error: any) {
    console.error(error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Terjadi kesalahan saat masuk.",
      data: error.data || null,
    });
  }
});
