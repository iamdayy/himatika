import jwt from "jsonwebtoken";
import { MemberModel } from "~~/server/models/MemberModel";
import { sendEmail } from "~~/server/utils/mailer";
import Email from "~~/server/utils/mailTemplate";

const getSecretKey = () => {
  const secretKey = useRuntimeConfig().jwtSecret;
  if (!secretKey) {
    throw new Error("JWT secret key is not configured.");
  }
  return secretKey;
};

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const email = body.email;
  const config = useRuntimeConfig();

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email is required",
    });
  }

  // Find member or guest
  let user: { email?: string; fullName: string; role: string; status?: string } | null = null;
  
  const member = await MemberModel.findOne({ email });
  if (member) {
      user = { email: member.email, fullName: member.fullName, role: 'member', status: member.status };
  } else {
      const { GuestModel } = await import("~~/server/models/GuestModel");
      const guest = await GuestModel.findOne({ email });
      if (guest) {
          user = { email: guest.email, fullName: guest.fullName, role: 'guest' };
      }
  }

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "Email not found in our database.",
    });
  }

  if (user.role === 'member' && user.status !== 'active' && user.status !== 'free') {
      // Ignore
  }

  // Generate Magic Token
  const magicToken = jwt.sign({ email: user.email, type: 'magic', role: user.role }, getSecretKey(), {
    expiresIn: "15m", // 15 minutes
  });

  const magicLink = `${config.public.public_uri}/api/auth/magic/verify?token=${magicToken}`;

  // Prepare Email
  const mailContent = new Email({
    recipientName: user.fullName,
    emailTitle: "Login to Himatika",
    heroTitle: "Magic Link Login",
    heroSubtitle: "Click the button below to log in to your Himatika account. This link is valid for 15 minutes.",
    heroButtonText: "Log In",
    heroButtonLink: magicLink,
    contentTitle1: "Login Request",
    contentParagraph1: `A login request was received for your account associated with ${user.email}. If you did not request this, please ignore this email.`,
    ctaTitle: "Need Help?",
    ctaSubtitle: "Contact the administrator if you have issues.",
    ctaButtonText: "Contact Support",
    ctaButtonLink: `${config.public.public_uri}/contact`, // Assumption
  });

  // Send Email
  await sendEmail(
    { name: config.public.appname, email: config.resend_from },
    user.email!,
    "Login to Himatika (Magic Link)",
    mailContent.render(),
    "auth"
  );

  return {
    statusCode: 200,
    message: "Magic link sent to your email.",
  };
});
