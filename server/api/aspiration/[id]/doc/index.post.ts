import { Types } from "mongoose";
import { AspirationModel } from "~~/server/models/AspirationModel";
import { DocModel } from "~~/server/models/DocModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { IFile, IMember } from "~~/types";
import { IReqAspirationDoc } from "~~/types/IRequestPost";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const { doc, label, tags, no } = await readBody<IReqAspirationDoc>(event);

    const { id } = event.context.params as { id: string };
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusMessage: "Unauthorized",
      });
    }
    const aspiration = await AspirationModel.findById(id);
    if (!aspiration) {
      return {
        statusCode: 404,
        statusMessage: "Aspiration not found",
      };
    }

    if ((aspiration.from as IMember).NIM !== user.member.NIM) {
      throw createError({
        statusMessage: "Unauthorized",
      });
    }
    const BASE_DOC_FOLDER = `/uploads/img/aspiration/${aspiration._id}/docs`;
    let docUrl = "";
    const d = doc as IFile;

    // Handle main doc upload
    const hashedName = await storeFileLocally(d, 12, BASE_DOC_FOLDER);
    docUrl = `${BASE_DOC_FOLDER}/${hashedName}`;
    const saved = await DocModel.create({
      label,
      on: aspiration._id,
      onModel: "Aspiration",
      no,
      tags: tags,
      doc: docUrl,
      uploader: (await getIdByNim(user.member.NIM)) as Types.ObjectId,
    });
    if (!saved) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to save doc",
      });
    }
    return {
      statusCode: 200,
      statusMessage: "Doc added successfully",
    };
  } catch (error: any) {
    console.error(error);
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
