import { Types } from "mongoose";
import { z } from "zod";
import { AspirationModel } from "~~/server/models/AspirationModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { IResponse } from "~~/types/IResponse";

const aspirationSchema = z.object({
  subject: z.string().min(3).max(100),
  message: z.string().min(10),
  anonymous: z.boolean().default(false),
});

export default defineEventHandler(
  async (event): Promise<IResponse & { data?: { id: string } }> => {
    try {
      const user = event.context.user;
      const body = await readValidatedBody(event, aspirationSchema.parse);

      if (!user) {
        return {
          statusCode: 401,
          statusMessage: "Unauthorized",
        };
      }

      const aspiration = await AspirationModel.create({
        ...body,
        from: await getMemberIdByNim(user.member.NIM),
      });

      if (!aspiration) {
        return {
          statusCode: 404,
          statusMessage: "Aspiration not created",
        };
      }
      return {
        statusCode: 200,
        statusMessage: "Aspiration created",
        data: { id: aspiration._id as string },
      };
    } catch (error: any) {
      if (error.statusCode === 400) {
        throw error; // Let Nuxt handle 400 from validation
      }
      throw createError({
        statusCode: 500,
        statusMessage: "Internal Server Error",
      });
    }
  }
);

const getMemberIdByNim = async (
  NIM: number
): Promise<Types.ObjectId | undefined> => {
  const member = await MemberModel.findOne({ NIM });
  return member?._id as Types.ObjectId | undefined;
};
