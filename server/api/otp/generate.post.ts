import otpGenerator from "otp-generator";
import { ConfigModel } from "~~/server/models/ConfigModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { OTPModel } from "~~/server/models/OTPModel";
import { generateQRCode } from "~~/server/utils/qrcode";
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
          throw createError({
            statusCode: 404,
            statusMessage: "Member not found",
            data: { message: "Email not found", name: "email" },
          });
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
          `Your ${configUse.name} App verivication code : ${otp.code}`,
          emailText(otp.type, linkTo, code, {
            fullName: member?.fullName || "",
            email: member?.email || "",
          }),
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
          newOTP.email,
          `Your ${configUse.name} App verivication code : ${newOTP.code}`,
          emailText(newOTP.type, linkTo, code, {
            fullName: member?.fullName || "",
            email: member?.email || "",
          }),
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
  }
) => {
  let newMail: EmailTemplate | undefined = undefined;
  switch (type) {
    case "Verify Account":
      newMail = {
        recipientName: user.fullName,
        emailTitle: `Verify your account`,
        heroTitle: `Welcome to ${code} App`,
        heroSubtitle: `Please verify your account`,
        heroButtonLink: link,
        heroButtonText: "Verify Account",
        contentTitle1: "Verify your account",
        contentParagraph1:
          "To verify your account, please click the button below.",
        contentParagraph2:
          "If you did not create an account, please ignore this email.",
        contentTitle2: "Need help?",
        contentListItems: [
          "If you have any questions, feel free to reach out to us.",
          "We are here to help you.",
        ],
        ctaTitle: "Need help?",
        ctaSubtitle: "Contact us at",
        ctaButtonLink: `${config.public.public_uri}/#contacts`,
        ctaButtonText: "Contact Us",
      };
      break;
    case "Change Password":
      newMail = {
        recipientName: user.fullName,
        emailTitle: `Change your password`,
        heroTitle: `Change your password`,
        heroSubtitle: `Please change your password`,
        heroButtonLink: link,
        heroButtonText: "Change Password",
        contentTitle1: "Change your password",
        contentParagraph1:
          "To change your password, please click the button below.",
        contentParagraph2:
          "If you did not request a password change, please ignore this email.",
        contentTitle2: "Need help?",
        contentListItems: [],
        ctaTitle: "Need help?",
        ctaSubtitle: "Contact us at",
        ctaButtonLink: `${config.public.public_uri}/#contacts`,
        ctaButtonText: "Contact Us",
      };
      break;
    case "Reset Password":
      newMail = {
        recipientName: user.fullName,
        emailTitle: `Reset your password`,
        heroTitle: `Reset your password`,
        heroSubtitle: `Please reset your password`,
        heroButtonLink: link,
        heroButtonText: "Reset Password",
        contentTitle1: "Reset your password",
        contentParagraph1:
          "To reset your password, please click the button below.",
        contentParagraph2:
          "If you did not request a password reset, please ignore this email.",
        contentTitle2: "Need help?",
        contentListItems: [],
        ctaTitle: "Need help?",
        ctaSubtitle: "Contact us at",
        ctaButtonLink: `${config.public.public_uri}/#contacts`,
        ctaButtonText: "Contact Us",
      };
      break;
    case "Change Email":
      newMail = {
        recipientName: user.fullName,
        emailTitle: `Change your email`,
        heroTitle: `Change your email`,
        heroSubtitle: `Please change your email`,
        heroButtonLink: link,
        heroButtonText: "Change Email",
        contentTitle1: "Change your email",
        contentParagraph1:
          "To change your email, please click the button below.",
        contentParagraph2:
          "If you did not request a change of email, please ignore this email.",
        contentTitle2: "Need help?",
        contentListItems: [],
        ctaTitle: "Need help?",
        ctaSubtitle: "Contact us at",
        ctaButtonLink: `${config.public.public_uri}/#contacts`,
        ctaButtonText: "Contact Us",
      };
      break;
    case "Verify Email":
      newMail = {
        recipientName: user.fullName,
        emailTitle: `Verify your email`,
        heroTitle: `Verify your email`,
        heroSubtitle: `Please verify your email`,
        heroButtonLink: link,
        heroButtonText: "Verify Email",
        contentTitle1: "Verify your email",
        contentParagraph1:
          "To verify your email, please click the button below.",
        contentParagraph2:
          "If you did not request a verification of email, please ignore this email.",
        contentTitle2: "Need help?",
        contentListItems: [],
        ctaTitle: "Need help?",
        ctaSubtitle: "Contact us at",
        ctaButtonLink: `${config.public.public_uri}/#contacts`,
        ctaButtonText: "Contact Us",
      };
      break;
  }
  if (!newMail) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid OTP type",
      data: { message: "Invalid OTP type", name: "type" },
    });
  }
  const email = new Email(newMail);
  return email.render();
};
