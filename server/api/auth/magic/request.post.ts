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

  // Find member
  const member = await MemberModel.findOne({ email });
  if (!member) {
    // Security: Don't reveal if email exists or not?
    // But for this internal app, maybe it's fine to say "Email not found".
    // Or just say "If the email is registered, a login link has been sent."
    // Let's go with the vague message for security best practices, unless user UX demands otherwise.
    // However, existing code in `signin.post.ts` explicitly throws "User not found".
    // Let's stick to existing pattern or be slightly better.
    // For now, let's return success even if not found to prevent enumeration, 
    // BUT since this is likely an organizational app where members are public/known, maybe it doesn't matter.
    // Implementation plan said: "If an email is not found in MemberModel, the login will be rejected."
    // So if I return success here but don't send email, user waits forever.
    // Let's check `request.post.ts` logic in my plan... 
    // Actually, explicit error might be better for UX in this closed system.
    throw createError({
      statusCode: 404,
      statusMessage: "Email not found in member database.",
    });
  }

  if (member.status !== 'active' && member.status !== 'free') {
      // Maybe block deleted/inactive?
      // `signin.post.ts` doesn't seem to block login based on member status directly, 
      // but `ensureAuth` might. `signin.post.ts` checks `user.verified`.
  }

  // Generate Magic Token
  const magicToken = jwt.sign({ email: member.email, type: 'magic' }, getSecretKey(), {
    expiresIn: "15m", // 15 minutes
  });

  const magicLink = `${config.public.public_uri}/api/auth/magic/verify?token=${magicToken}`;

  // Prepare Email
  const mailContent = new Email({
    recipientName: member.fullName,
    emailTitle: "Login to Himatika",
    heroTitle: "Magic Link Login",
    heroSubtitle: "Click the button below to log in to your Himatika account. This link is valid for 15 minutes.",
    heroButtonText: "Log In",
    heroButtonLink: magicLink,
    contentTitle1: "Login Request",
    contentParagraph1: `A login request was received for your account associated with ${member.email}. If you did not request this, please ignore this email.`,
    ctaTitle: "Need Help?",
    ctaSubtitle: "Contact the administrator if you have issues.",
    ctaButtonText: "Contact Support",
    ctaButtonLink: `${config.public.public_uri}/contact`, // Assumption
  });

  // Send Email
  await sendEmail(
    { name: config.public.appname, email: config.resend_from },
    member.email!,
    "Login to Himatika (Magic Link)",
    mailContent.render(),
    "auth"
  );

  return {
    statusCode: 200,
    message: "Magic link sent to your email.",
  };
});
