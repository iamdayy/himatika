import { Types } from "mongoose";
import { CommentModel } from "~~/server/models/CommentModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { NewsModel } from "~~/server/models/NewsModel";
import { IComment } from "~~/types";

export default defineEventHandler(async (event) => {
  try {
    const { id } = event.context.params as { id: string };
    const { anonymous } = getQuery(event);
    const user = event.context.user;
    const body = await readBody<IComment>(event);
    if (user && anonymous == "false") {
      body.author = (await getIdByNim(user.member.NIM)) as Types.ObjectId;
    }
    const news = await NewsModel.findById(id);
    if (!news) {
      throw createError({
        statusCode: 404,
        statusMessage: "News Not Found",
      });
    }

    const comment = await CommentModel.create(body);
    if (!comment) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to create comment",
      });
    }
    news.comments?.push(comment._id as any);
    news.save();
    return {
      statusCode: 200,
      statusMessage: "Comment Created Successfully",
    };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    };
  }
});

/**
 * Retrieves the user's ID by their NIM (Nomor Induk Mahasiswa).
 * @param {number} NIM - The user's NIM.
 * @returns {Promise<Types.ObjectId | undefined>} The user's ID or undefined if not found.
 * @throws {H3Error} If an error occurs during the database query.
 */
const getIdByNim = async (NIM: number): Promise<Types.ObjectId | undefined> => {
  try {
    const member = await MemberModel.findOne({ NIM });
    return member?._id as Types.ObjectId;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve user ID by NIM",
    });
  }
};
