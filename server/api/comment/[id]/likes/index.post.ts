import { Types } from "mongoose";
import { CommentModel } from "~~/server/models/CommentModel";
import { MemberModel } from "~~/server/models/MemberModel";

export default defineEventHandler(async (event) => {
  try {
    const { id } = event.context.params as { id: string };
    const user = event.context.user;
    const like: {
      by: "Guest" | "Member";
      member?: Types.ObjectId;
      ip?: string | string[];
    } = {
      by: "Guest",
    };
    if (user) {
      like.by = "Member";
    }
    // Menggunakan alamat IP sebagai identifier untuk guest
    const userIp =
      event.req.headers["x-forwarded-for"] ||
      event.req.connection.remoteAddress;

    // Mencari berita
    const comment = await CommentModel.findById(id);
    if (!comment) {
      throw createError({
        statusCode: 404,
        statusMessage: "Comment Not Found",
      });
    }

    // Memeriksa apakah pengguna telah memberikan like
    let likeIndex = comment.likes?.findIndex((like) => like.ip === userIp);
    if (likeIndex !== -1) {
      comment.likes?.splice(likeIndex as number, 1);
      await comment.save();
      return {
        statusCode: 200,
        statusMessage: "Like removed successfully",
      };
    }

    // Menentukan apakah user terautentikasi
    if (user) {
      like.member = (await getIdByNim(user.member.NIM)) as Types.ObjectId;
      like.ip = userIp;
    } else {
      like.ip = userIp; // Menyimpan alamat IP untuk guest
    }

    // Menambahkan like ke berita
    comment.likes?.push(like);
    await comment.save();

    return {
      statusCode: 200,
      statusMessage: "Like added successfully",
    };
  } catch (error: any) {
    console.log(error);

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
