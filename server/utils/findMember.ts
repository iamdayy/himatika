import type { Types } from "mongoose";
import { MemberModel } from "../models/MemberModel";

/**
 * Finds a member by NIM (Nomor Induk Mahasiswa) and returns its ObjectId.
 *
 * @param nim - The NIM to search for.
 * @returns A Promise that resolves to the member's ObjectId if found, or false otherwise.
 * @throws {Error} If there's an error during the database operation.
 */
export const findMemberByNim = async (nim: number): Promise<Types.ObjectId> => {
  try {
    const member = await MemberModel.findOne({ NIM: nim });
    if (!member) {
      throw createError({
        statusCode: 404,
        message: "Member not found",
      });
    }
    return member._id as Types.ObjectId;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode,
      message: error.message,
    });
  }
};

/**
 * Finds a member by its ObjectId and marks it as registered by changing its status to "active".
 *
 * @param id - The ObjectId of the member to find and mark as registered.
 * @throws {Error} If the member is not found or cannot be registered, or if there's an error during the database operation.
 */
export const findMemberAndMarkRegister = async (
  id: Types.ObjectId,
  email: string
): Promise<void> => {
  try {
    const member = await MemberModel.findById(id);
    if (!member) {
      throw createError({
        statusCode: 404,
        message: "Member not found",
      });
    }
    if (member.status !== "free") {
      throw createError({
        statusCode: 400,
        message: "This member cannot be registered",
      });
    }
    member.status = "active";
    member.email = email;
    await member.save();
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message:
        error.message || "An error occurred while registering the member",
    });
  }
};
