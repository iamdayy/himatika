import crypto from "crypto";
import { z } from "zod";
import { MemberModel } from "~~/server/models/MemberModel";
import { OTPModel } from "~~/server/models/OTPModel";
import { UserModel } from "~~/server/models/UserModel";
import { generateToken } from "~~/server/utils/TokenHelper";
import { enforceRateLimit } from "~~/server/utils/rateLimit";
import { IVerifyOTPResponse } from "~~/types/IResponse";

const MAX_ATTEMPTS = 5;

/** Constant-time comparison that tolerates differing input lengths. */
const safeEqual = (a: string, b: string): boolean => {
  const da = crypto.createHash("sha256").update(a).digest();
  const db = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(da, db);
};

const verifyOTPSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  code: z.string().min(1, "Kode OTP diperlukan"),
  type: z.enum([
    "Verify Account",
    "Change Password",
    "Reset Password",
    "Change Email",
    "Change Phone",
    "Verify Email",
    "Verify Phone",
  ]),
});

export default defineEventHandler(
  async (event): Promise<IVerifyOTPResponse> => {
    try {
      const t = await useTranslationServerMiddleware(event);
      const rawBody = await readBody(event);
      const validation = verifyOTPSchema.safeParse(rawBody);

      if (!validation.success) {
        throw createError({
          statusCode: 400,
          statusMessage: "Validasi gagal",
          data: validation.error.format(),
        });
      }

      const { code, email, type } = validation.data;

      // Shared brute-force gate per email (cross-instance, Mongo-backed).
      await enforceRateLimit(`otp-verify:${email}`, 5, 60_000);

      const otp = await OTPModel.findOne({ email, type });

      if (!otp) {
        throw createError({
          statusCode: 400,
          statusMessage: t("otp_page.otp_not_found"),
        });
      }

      // Consume-once: a code already used by its final step cannot be
      // verified again (no replay within the TTL window).
      if (otp.usedAt) {
        throw createError({
          statusCode: 400,
          statusMessage: "Kode OTP sudah pernah digunakan. Silakan minta kode baru.",
        });
      }

      if (!safeEqual(otp.code, code)) {
        const attempts = (otp.attempts ?? 0) + 1;
        await OTPModel.updateOne({ _id: otp._id }, { $inc: { attempts: 1 } });
        if (attempts >= MAX_ATTEMPTS) {
          // Lockout: burn the code so further guesses are impossible.
          await OTPModel.deleteOne({ _id: otp._id });
          throw createError({
            statusCode: 429,
            statusMessage:
              "Terlalu banyak percobaan salah. Kode telah diblokir — silakan minta kode OTP baru.",
          });
        }
        throw createError({
          statusCode: 400,
          statusMessage: t("otp_page.otp_not_match"),
        });
      }

      if (otp.expiresAt < new Date()) {
        // Hapus OTP yang sudah expired
        await OTPModel.deleteOne({ _id: otp._id });
        throw createError({
          statusCode: 400,
          statusMessage: t("otp_page.otp_expired"),
        });
      }
      const member = await MemberModel.findOne({
        $or: [{ email }, { NIM: otp.NIM }],
      });
      if (!member) {
        throw createError({
          statusCode: 404,
          statusMessage: t('register_page.member_not_found'),
          data: { message: t('register_page.check_member'), name: "email" },
        });
      }
      const user = await UserModel.findOne({ member: member._id as any });
      if (!user) {
        throw createError({
          statusCode: 404,
          statusMessage: t('register_page.member_not_found'),
          data: { message: t('register_page.check_member'), name: "email" }
        });
      }
      const token = await generateToken(member.email, otp.code, otp.type);

      return {
        statusCode: 200,
        statusMessage: t("otp_page.otp_verified"),
        data: {
          token,
          type,
        },
      };
    } catch (error: any) {
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || "Terjadi Kesalahan Server",
      });
    }
  }
);
