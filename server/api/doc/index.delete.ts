import { DocModel } from "~~/server/models/DocModel";
import { IMember } from "~~/types";
import { IResponse } from "~~/types/IResponse";
import { deleteFromR2 } from "~~/server/utils/storage";

const config = useRuntimeConfig();
export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const user = event.context.user;
    const organizer = event.context.organizer;
    if (!user) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be logged in to use this endpoint",
      });
    }
    const { id } = getQuery(event);
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "No doc id provided",
      });
    }
    const doc = await DocModel.findById(id);
    if (!doc) {
      throw createError({
        statusCode: 404,
        statusMessage: "Doc not found",
      });
    }
    if ((doc.uploader as IMember).NIM !== user.member.NIM && !organizer) {
      throw createError({
        statusCode: 403,
        statusMessage: "You are not authorized to delete this doc",
      });
    }
    // Delete the associated main doc file if it exists
    if (doc.doc) {
      await deleteFromR2(doc.doc as string);
    }
    if (doc.trails) {
      // Delete the associated trail doc files if they exist
      await Promise.all(
        doc.trails.map(async (trail) => {
          if (trail.doc) {
            await deleteFromR2(trail.doc as string);
          }
        })
      );
    }
    await DocModel.findByIdAndDelete(id);
    return { statusCode: 200, statusMessage: "Doc deleted" };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Internal Server Error",
    };
  }
});
