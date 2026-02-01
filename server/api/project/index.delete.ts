import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ProjectModel } from "~~/server/models/ProjectModel";
import { IResponse } from "~~/types/IResponse";

const config = useRuntimeConfig();

/**
 * Handles DELETE requests for removing a project.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<Object>} An object containing the status code and message of the operation.
 * @throws {H3Error} If the user is not authorized, the project is not found, or if a system error occurs.
 */
export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    // Ensure the user is authenticated and has the necessary permissions
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be logged in to use this endpoint",
      });
    }
    if (!event.context.organizer) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be admin / departement to use this endpoint",
      });
    }

    // Get the project slug from the query parameters
    const { id } = getQuery(event);

    // Find the project by slug
    const project = await ProjectModel.findById(id);
    if (!project) {
      throw createError({
        statusCode: 404,
        message: "Project not found",
      });
    }

    // Delete the associated main image file if it exists
    if (project.image) {
      const mainImageKey = (project.image as string).split("/").pop(); //Get only file name without domain;
      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: mainImageKey,
        })
      );
    }

    // Delete the project from the database
    await ProjectModel.findByIdAndDelete(id);

    // Return success response
    return {
      statusCode: 200,
      statusMessage: `Project "${project.title}" successfully deleted`,
    };
  } catch (error: any) {
    // Handle any errors that occur during the process
    return {
      statusCode: error.statusCode || 500,
      statusMessage:
        error.message ||
        "An unexpected error occurred while deleting the project",
    };
  }
});
