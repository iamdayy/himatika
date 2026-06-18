import { MultiPartData } from "h3";
import { DocModel } from "~~/server/models/DocModel";
import { IDoc, ISign } from "~~/types";
import { uploadToR2, StoragePaths } from "~~/server/utils/storage";

export default defineEventHandler(async (event) => {
  try {
    const data = await customReadMultipartFormData<IDoc>(event, {
      allowedTypes: ["application/pdf"],
      maxFileSize: 3 * 1024 * 1024, // 3MB
    });

    const user = event.context.user;
    if (!user) {
      throw createError({
        statusMessage: "Unauthorized",
      });
    }

    const d = data.doc as MultiPartData;

    // Upload ke R2
    const url = await uploadToR2(d, StoragePaths.DOCS);

    data.doc = url;
    // ----------------------------------------------

    const saved = await DocModel.create({
      label: data.label as string,
      doc: url,
      no: data.no as string,
      signs: await Promise.all(
        await JSON.parse(data.signs as string).map(async (sign: ISign) => {
          const memberId = await findMemberByNim(sign.user as number);
          if (!memberId) {
            throw createError({
              statusCode: 404,
              statusMessage: "Member not found",
            });
          }
          return {
            ...sign,
            user: memberId,
          };
        })
      ),
      trails: [
        {
          user: user.member._id,
          action: "CREATE",
        },
      ],
      tags: data.tags ? JSON.parse(data.tags as string) : [],
      uploader: user.member._id,
    });
    if (!saved) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to save doc",
      });
    }
    
    // Broadcast notification
    // broadcast('notification', {
    //   title: 'New Document',
    //   message: `${saved.label} has been uploaded.`,
    //   type: 'success',
    //   icon: 'i-heroicons-document-text',
    //   link: `/dashboard/signature` // Adjust link as needed
    // });
    
    // Audit Log
    logAction({
        action: 'CREATE',
        event,
        target: `Document: ${saved.label}`,
        details: { docId: saved._id }
    });

    return {
      statusCode: 200,
      statusMessage: "Doc added successfully",
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      statusMessage: "Internal Server Error",
    };
  }
});
