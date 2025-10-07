import { put } from "@vercel/blob";
import { Types } from "mongoose";
import { AgendaModel } from "~~/server/models/AgendaModel";
import { DocModel } from "~~/server/models/DocModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { IDoc, IMember, IRequestSign } from "~~/types";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const { doc, no, label, tags, signs } =
      await customReadMultipartFormData<IDoc>(event);

    const { id } = event.context.params as { id: string };
    const user = event.context.user;
    const organizer = event.context.organizer;
    if (!user) {
      throw createError({
        statusMessage: "Unauthorized",
      });
    }
    const agenda = await AgendaModel.findById(id);
    if (!agenda) {
      return {
        statusCode: 404,
        statusMessage: "Agenda not found",
      };
    }
    if (
      !agenda.committees
        ?.map((committee) => (committee.member as IMember).NIM)
        .includes(user.member.NIM)
    ) {
      throw createError({
        statusMessage: "Unauthorized",
      });
    }
    const BASE_DOC_FOLDER = `/uploads/img/agenda/${agenda._id}/docs`;
    let docUrl = "";
    const d = doc as File;
    const fileName = `${BASE_DOC_FOLDER}/${hashText(`${agenda._id}`)}.${
      d.type?.split("/")[1] || "pdf"
    }`;
    // Handle main doc upload
    const { url } = await put(fileName, d, {
      access: "public",
    });
    docUrl = url;
    const saved = await DocModel.create({
      label,
      on: agenda._id,
      onModel: "Agenda",
      no,
      tags: tags ? tags : [],
      doc: docUrl,
      uploader: (await getIdByNim(user.member.NIM)) as Types.ObjectId,
      signs: signs
        ? await Promise.all(
            (JSON.parse(signs) as IRequestSign[]).map(async (request) => ({
              user: request.user
                ? ((await findMemberByNim(
                    request.user as number
                  )) as Types.ObjectId)
                : request.user,
              as: request.as,
            }))
          )
        : [],
      trails: [
        {
          user: (await findMemberByNim(user.member.NIM)) as Types.ObjectId,
          action: "create",
        },
      ],
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
