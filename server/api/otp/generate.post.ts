import otpGenerator from "otp-generator";
import { ConfigModel } from "~~/server/models/ConfigModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { OTPModel } from "~~/server/models/OTPModel";
import Email, { EmailTemplate } from "~~/server/utils/mailTemplate";
import { IReqGenerateOTP } from "~~/types/IRequestPost";
import { IGenerateOTPResponse } from "~~/types/IResponse";
const config = useRuntimeConfig();
export default defineEventHandler(
  async (event): Promise<IGenerateOTPResponse> => {
    try {
      const { email, type, link, NIM } = await readBody<IReqGenerateOTP>(event);

      const member = await MemberModel.findOne({ email, NIM });
      if (!member) {
        if (type !== "Change Email") {
          // Silent failure: return fake success to prevent user enumeration
          const now = new Date();
          const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
          return {
            statusCode: 200,
            statusMessage: "OTP code has been sent to your email",
            data: {
              email,
              expiresAt: expiresAt.toString(),
            },
          };
        }
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

      let linkTo = `${config.public.public_uri}${link}&code=${code}&expiresAt=${expiresAt}`;
      const sender = {
        email: "otp-code@" + config.mailtrap_domain,
        name: `${configUse.name} App OTP Code`,
      };

      const t = await useTranslationServerMiddleware(event);
      const otp = await OTPModel.findOne({ email });
      if (otp) {
        // otp.code = code;
        otp.expiresAt = expiresAt;
        await otp.save();
        linkTo = `${config.public.public_uri}${link}&code=${otp.code}&expiresAt=${otp.expiresAt}`;
        // Simpan OTP ke database
        const mailed = await sendEmail(
          sender,
          email,
          `${t('emails.otp.' + otp.type.toLowerCase().replace(/ /g, '_') + '.subject')}`,
          emailText(otp.type, linkTo, code, {
            fullName: member?.fullName || "",
            email: member?.email || "",
          }, t),
          "OTP Code"
        );

        if (!mailed) {
          throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
            data: { message: "Email not sent", name: "email" },
          });
        }
      } else {
        // Simpan OTP ke database
        const newOTP = await OTPModel.create({
          email,
          code,
          NIM,
          expiresAt,
          type,
        });
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
            statusMessage: "Internal Server Error",
            data: { message: "Email not sent", name: "email" },
          });
        }
      }
      return {
        statusCode: 200,
        statusMessage: "OTP code has been sent to your email",
        data: {
          email,
          expiresAt: expiresAt.toString(),
        },
      };
    } catch (error: any) {
      console.error("Error generating OTP:", error);
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.statusMessage,
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
    footerText: footerText
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
