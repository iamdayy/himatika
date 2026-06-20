import { Types } from "mongoose";
import { MemberModel } from "~~/server/models/MemberModel";
import { NewsModel } from "~~/server/models/NewsModel";

export default defineEventHandler(async (event) => {
  try {
    const { id } = event.context.params as { id: string };
    const user = event.context.user;
    if (user) {
      // ... placeholder logic for TS, actual logic moved below ...
    }
    const userIpRaw =
      event.req.headers["x-forwarded-for"] ||
      event.req.connection.remoteAddress;
    const ipStr = Array.isArray(userIpRaw) ? userIpRaw[0] : (userIpRaw as string);

    // Mencari eksistensi berita
    const newsExists = await NewsModel.exists({ _id: id });
    if (!newsExists) {
      throw createError({
        statusCode: 404,
        statusMessage: "News Not Found",
      });
    }

    // Memeriksa apakah pengguna telah memberikan like menggunakan atomic query
    const existingLike = await NewsModel.findOne({ _id: id, "likes.ip": ipStr }).lean();

    if (existingLike) {
      // Hapus like dengan Atomic Pull
      await NewsModel.updateOne(
        { _id: id },
        { $pull: { likes: { ip: ipStr } } }
      );
      return {
        statusCode: 200,
        statusMessage: "Like removed successfully",
      };
    } else {
      // Tambah like dengan Atomic Push
      const likeObj: any = { by: "Guest", ip: ipStr };
      if (user) {
        likeObj.by = "Member";
        likeObj.member = await getIdByNim(user.member.NIM);
      }
      
      await NewsModel.updateOne(
        { _id: id },
        { $push: { likes: likeObj } }
      );
      return {
        statusCode: 200,
        statusMessage: "Like added successfully",
      };
    }
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
