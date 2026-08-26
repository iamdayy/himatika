import otpGenerator from "otp-generator";
import { z } from "zod";
import { ConfigModel } from "~~/server/models/ConfigModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { OTPModel } from "~~/server/models/OTPModel";
import Email, { EmailTemplate } from "~~/server/utils/mailTemplate";
import { sendWhatsappMessage } from "~~/server/utils/whatsapp";
import { IGenerateOTPResponse } from "~~/types/IResponse";
const config = useRuntimeConfig();

const generateOTPSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  NIM: z.union([z.string(), z.number()]).transform(val => Number(val)),
  type: z.enum([
    "Verify Account",
    "Change Password",
    "Reset Password",
    "Change Email",
    "Change Phone",
    "Verify Email",
    "Verify Phone",
  ]),
  link: z
    .string()
    .min(1, "Link diperlukan")
    .max(2048)
    // Must be an app-relative path — never an absolute or protocol-relative URL.
    // The OTP code is appended to this link inside the email, so an attacker
    // controlled origin here would exfiltrate the code via phishing.
    .refine(
      (value) =>
        value.startsWith("/") &&
        !value.startsWith("//") &&
        !value.includes("://") &&
        !value.includes("\\") &&
        !/[\u0000-\u001f\u007f]/.test(value),
      { message: "Link harus berupa path relatif aplikasi" }
    ),
});

export default defineEventHandler(
  async (event): Promise<IGenerateOTPResponse> => {
    try {
      const rawBody = await readBody(event);
      const validation = generateOTPSchema.safeParse(rawBody);

      if (!validation.success) {
        throw createError({
          statusCode: 400,
          statusMessage: "Validasi gagal",
          data: validation.error.format(),
        });
      }

      const { email, type, link, NIM } = validation.data;

      const member = await MemberModel.findOne({ email, NIM });
      if (!member) {
        // Silent failure for all types: return fake success to prevent user enumeration
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
        return {
          statusCode: 200,
          statusMessage: "Kode OTP telah dikirim ke email Anda",
          data: {
            email,
            expiresAt: expiresAt.toString(),
          },
        };
      }

      // Rate-limit: cek apakah OTP untuk email+type ini masih valid
      const existingOTP = await OTPModel.findOne({ email, type });
      if (existingOTP && existingOTP.expiresAt > new Date()) {
        const remainingMs = existingOTP.expiresAt.getTime() - Date.now();
        const remainingSec = Math.ceil(remainingMs / 1000);
        throw createError({
          statusCode: 429,
          statusMessage: `Kode OTP masih aktif. Silakan tunggu ${remainingSec} detik sebelum meminta ulang.`,
          data: { 
            message: `Tunggu ${remainingSec} detik`, 
            name: "rate_limit",
            expiresAt: existingOTP.expiresAt.toString(),
          },
        });
      }

      const configuration = await ConfigModel.find().select("-id");
      const configUse = configuration[configuration.length - 1];
      // Generate OTP
      const code = otpGenerator.generate(6, {
        upperCaseAlphabets: true,
        specialChars: false,
      });

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 menit

      const linkTo = `${config.public.public_uri}${link}&code=${code}&expiresAt=${expiresAt}`;
      const sender = {
        email: config.resend_from,
        name: `${configUse?.name} App OTP Code`,
      };

      const t = await useTranslationServerMiddleware(event);

      // Upsert: update existing atau create baru berdasarkan {email, type}
      await OTPModel.findOneAndUpdate(
        { email, type },
        { code, NIM, expiresAt, createdAt: now },
        { upsert: true, new: true }
      );

      // Kirim email
      const mailed = await sendEmail(
        sender,
        email,
        `${t('emails.otp.' + type.toLowerCase().replace(/ /g, '_') + '.subject')}`,
        emailText(type, linkTo, code, {
          fullName: member?.fullName || "",
          email: member?.email || "",
        }, t),
        "OTP Code"
      );

      if (!mailed) {
        throw createError({
          statusCode: 500,
          statusMessage: "Terjadi Kesalahan Server",
          data: { message: "Email gagal dikirim", name: "email" },
        });
      }

      if (member && (member as any).phone) {
        const waMessage = `*[HIMATIKA - Verifikasi OTP]*\n\nKode OTP Anda adalah: *${code}*\n\n_PENTING: Jangan berikan kode ini kepada siapapun, termasuk pihak yang mengatasnamakan HIMATIKA._\n\nKode ini akan kedaluwarsa dalam 10 menit.`;
        sendWhatsappMessage((member as any).phone, waMessage).catch((err: any) => {
          console.error('[OTP] Background WAHA send error:', err);
        });
      }

      return {
        statusCode: 200,
        statusMessage: "Kode OTP telah dikirim ke email Anda",
        data: {
          email,
          expiresAt: expiresAt.toString(),
        },
      };
    } catch (error: any) {
      console.error("Error generating OTP:", error);
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || "Terjadi Kesalahan Server",
        data: error.data,
      });
    }
  }
);

const emailText = (
  type:
    | "Verify Account"
    | "Change Password"
    | "Reset Password"
    | "Change Email"
    | "Change Phone"
    | "Verify Email"
    | "Verify Phone",
  link: string,
  code: string,
  user: {
    fullName: string;
    email: string;
  },
  t: any
) => {
  const typeSlug = type.toLowerCase().replace(/ /g, '_');
  const footerText = {
    rights: t('emails.footer.rights'),
    privacy: t('emails.footer.privacy'),
    terms: t('emails.footer.terms'),
    unsubscribeReason: t('emails.footer.unsubscribe_reason', { serviceName: config.public.appname }),
    unsubscribeAction: t('emails.footer.unsubscribe_action'),
    here: t('emails.footer.here')
  };

  // Base template structure using localized strings
  const newMail: EmailTemplate = {
    recipientName: user.fullName,
    emailTitle: t(`emails.otp.${typeSlug}.subject`),
    heroTitle: t(`emails.otp.${typeSlug}.hero_title`, { appName: config.public.appname }),
    heroSubtitle: t(`emails.otp.${typeSlug}.hero_subtitle`),
    heroButtonLink: link,
    heroButtonText: t(`emails.otp.${typeSlug}.button`),
    contentTitle1: t(`emails.otp.${typeSlug}.content_title`),
    contentParagraph1: t(`emails.otp.${typeSlug}.content_p1`),
    contentParagraph2: t(`emails.otp.${typeSlug}.content_p2`),
    contentTitle2: t('emails.otp.help.title'),
    contentListItems: [
      t('emails.otp.help.content_1'),
      t('emails.otp.help.content_2')
    ],
    ctaTitle: t('emails.otp.help.cta_title'),
    ctaSubtitle: t('emails.otp.help.cta_subtitle'),
    ctaButtonLink: `${config.public.public_uri}/#contacts`,
    ctaButtonText: t('emails.otp.help.button'),
    footerText: footerText,
    otpCode: code,
  };

  // Since all types follow the same structure in our new JSON, we can return directly.
  // Unless there are specific deviations for specific types, but based on previous code they were very similar.
  // The only exception previously was contentListItems being empty for some.

  // Let's refine based on previous switch cases if needed, but standardization is better.
  // Previous code had empty list items for 'Change Password' etc.
  // I will keep the help section for all as it is good UX.

  if (!newMail) { // check technically redundant now but kept for logic safety if we add logic later
    // ...
  }

  const email = new Email(newMail);
  return email.render();
};
