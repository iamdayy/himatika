import { SessionModel } from "~~/server/models/SessionModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { IResponse } from "~~/types/IResponse";

/**
 * Changes the email of the currently authenticated member.
 * Authorization is derived from the session (event.context.user); the legacy
 * `token` query-param mechanism was removed because the UserModel.token field
 * was never populated, which allowed cross-account email changes.
 */
export default defineEventHandler(
  async (event): Promise<IResponse & { data: { email: string } }> => {
    const sessionUser = event.context.user;
    if (!sessionUser?.member?.NIM) {
      throw createError({
        statusCode: 401,
        statusMessage: "You must be logged in as a member to change your email",
      });
    }

    const body = await readBody<{ email?: string }>(event);
    const email = body?.email;

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Error: Invalid email format",
        data: { message: "Invalid email format", path: "email" },
      });
    }

    const member = await MemberModel.findOne({ NIM: sessionUser.member.NIM });
    if (!member) {
      throw createError({
        statusCode: 404,
        statusMessage: "Error: Member not found",
        data: { message: "Member not found", path: "NIM" },
      });
    }
    if (email === member.email) {
      throw createError({
        statusCode: 400,
        statusMessage: "Error: Email already registered",
        data: { message: "Email already registered", path: "email" },
      });
    }

    // Enforce uniqueness across members
    const emailTaken = await MemberModel.exists({
      email,
      _id: { $ne: member._id },
    });
    if (emailTaken) {
      throw createError({
        statusCode: 409,
        statusMessage: "Error: Email already in use by another member",
        data: { message: "Email already in use", path: "email" },
      });
    }

    member.email = email;
    await member.save();

    // Force re-authentication so JWT claims (member.email snapshot) refresh.
    await SessionModel.deleteMany({ user: sessionUser._id as any });

    return {
      statusCode: 200,
      statusMessage: "Success",
      data: {
        email: member.email,
      },
    };
  }
);
