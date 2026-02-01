import { ProjectModel } from "~~/server/models/ProjectModel";
import { IReqProjectQuery } from "~~/types/IRequestPost";
import type { IResponse } from "~~/types/IResponse";
/**
 * Handles GET requests for publishing a project.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<Object>} An object containing the status code and message of the operation.
 * @throws {H3Error} If the project is not found, the user is not authorized, or if a system error occurs.
 */
export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    // Get the slug from the query parameters
    const { id } = getQuery<IReqProjectQuery>(event);

    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 403,
        statusMessage: "Anda harus login untuk menggunakan endpoint ini",
      });
    }
    if (!event.context.organizer) {
      throw createError({
        statusCode: 403,
        statusMessage: "Anda harus menjadi admin / departemen untuk menggunakan endpoint ini",
      });
    }

    // Find the project by slug
    const project = await ProjectModel.findById(
      id,
      {},
      { autopopulate: false }
    );
    if (!project) {
      throw createError({
        statusCode: 404,
        statusMessage: "Proyek tidak ditemukan",
      });
    }

    // Check if the project is already published
    if (!project.published) {
      // Ensure the user is authenticated and has the necessary permissions
      const user = await ensureAuth(event);
      if (!user.member.organizer) {
        throw createError({
          statusCode: 403,
          statusMessage: "Anda harus menjadi admin / departemen untuk menggunakan endpoint ini",
        });
      } else {
        // Publish the project
        project.published = true;
        project.publishedAt = new Date();
        await project.save();
        return {
          statusCode: 200,
          statusMessage: `Proyek "${project.title}" berhasil diterbitkan`,
        };
      }
    }

    // Return error if the project is already published
    return {
      statusCode: 400,
      statusMessage: `Proyek "${project.title}" sudah diterbitkan`,
    };
  } catch (error: any) {
    // Handle any errors that occur during the process
    return {
      statusCode: error.statusCode || 500,
      statusMessage:
        error.message ||
        "Terjadi kesalahan yang tidak terduga saat menerbitkan proyek",
    };
  }
});
