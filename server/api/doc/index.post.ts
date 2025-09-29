import { Types } from "mongoose";
import { DocModel } from "~~/server/models/DocModel";
import { IDoc, IFile } from "~~/types";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const { doc, label, tags, signs, no } = await readBody<IDoc>(event);

    const user = event.context.user;
    if (!user) {
      throw createError({
        statusMessage: "Unauthorized",
      });
    }
    const BASE_DOC_FOLDER = `/uploads/docs/${label.replace(/\s+/g, "_")}`;
    let docUrl = "";

    // Handle main doc upload
    const hashedName = await storeFileLocally(
      doc as IFile,
      12,
      BASE_DOC_FOLDER
    );
    docUrl = `${BASE_DOC_FOLDER}/${hashedName}`;
    const saved = await DocModel.create({
      label,
      no,
      tags: tags,
      doc: docUrl,
      uploader: (await findMemberByNim(user.member.NIM)) as Types.ObjectId,
      signs: signs
        ? await Promise.all(
            signs.map(async (request) => ({
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
          action: "CREATE",
          actionAt: new Date(),
          actionIp: getRequestIP(event),
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
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    });
  }
});
