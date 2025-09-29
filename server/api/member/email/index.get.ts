import { MemberModel } from "~~/server/models/MemberModel";
import { UserModel } from "~~/server/models/UserModel";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (
    event
  ): Promise<IResponse & { data: { email: string; username: string } }> => {
    // Read the request query
    const { NIM } = getQuery(event);
    // Validate the request body
    const member = await MemberModel.findOne({ NIM });
    if (!member) {
      throw createError({
        statusCode: 400,
        statusMessage: "Error: NIM not found",
        data: { message: "NIM not found", path: "NIM" },
      });
    }
    const user = await UserModel.findOne({ member: member._id });
    if (!user) {
      throw createError({
        statusCode: 400,
        statusMessage: "Error: User not found",
        data: { message: "User not found", path: "NIM" },
      });
    }
    if (user.verified) {
      throw createError({
        statusCode: 400,
        statusMessage: "Error: User already verified",
        data: { message: "User already verified", path: "NIM" },
      });
    }
    return {
      statusCode: 200,
      statusMessage: "Success",
      data: {
        email: member.email,
        username: user.username,
      },
    };
  }
);
