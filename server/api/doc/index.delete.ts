import fs from "fs";
import path from "path";
import { DocModel } from "~~/server/models/DocModel";
import { IMember } from "~~/types";
import { IResponse } from "~~/types/IResponse";
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
    if ((doc?.uploader as IMember).NIM !== user.member.NIM && !organizer) {
      throw createError({
        statusCode: 403,
        statusMessage: "You are not authorized to delete this doc",
      });
    }
    // Delete the associated main doc file if it exists
    if (doc && doc.doc) {
      const docPath = path.join(config.storageDir, doc.doc as string);
      if (fs.existsSync(docPath)) {
        deleteFile(doc.doc as string);
      }
    }
    if (doc && doc.trails) {
      // Delete the associated trail doc files if they exist
      doc.trails.forEach((trail) => {
        if (trail.doc) {
          const trailDocPath = path.join(
            config.storageDir,
            trail.doc as string
          );
          if (fs.existsSync(trailDocPath)) {
            deleteFile(trail.doc as string);
          }
        }
      });
    }
    if (!doc) {
      throw createError({
        statusCode: 404,
        statusMessage: "Doc not found",
      });
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
