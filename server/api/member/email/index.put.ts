import { MemberModel } from "~~/server/models/MemberModel";
import { UserModel } from "~~/server/models/UserModel";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IResponse & { data: { email: string } }> => {
    // Read the request query
    const { token } = getQuery(event);
    const { email } = await readBody(event);

    const user = await UserModel.findOne(
      {
        token,
      },
      {},
      { autopopulate: false }
    ).populate({
      path: "member",
      model: MemberModel,
    });
    if (!user) {
      throw createError({
        statusCode: 400,
        statusMessage: "Error: Invalid token",
        data: { message: "Invalid token", path: "token" },
      });
    }
    console.log(user);

    // Validate the request body
    const member = await MemberModel.findOne({ NIM: user.member.NIM });
    if (!member) {
      throw createError({
        statusCode: 400,
        statusMessage: "Error: NIM not found",
        data: { message: "NIM not found", path: "NIM" },
      });
    }
    if (email === member.email) {
      throw createError({
        statusCode: 400,
        statusMessage: "Error: Email already registered",
        data: { message: "Email already registered", path: "email" },
      });
    }
    member.email = email;
    await member.save();
    return {
      statusCode: 200,
      statusMessage: "Success",
      data: {
        email: member.email,
      },
    };
  }
);
