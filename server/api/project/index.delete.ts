import { ProjectModel } from "~~/server/models/ProjectModel";
import { IResponse } from "~~/types/IResponse";
import { deleteFromR2 } from "~~/server/utils/storage";

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
        statusMessage: "Anda harus login untuk menggunakan endpoint ini",
      });
    }
    if (!event.context.organizer) {
      throw createError({
        statusCode: 403,
        statusMessage: "Anda harus menjadi admin / departemen untuk menggunakan endpoint ini",
      });
    }

    // Get the project slug from the query parameters
    const { id } = getQuery(event);

    // Find the project by slug
    const project = await ProjectModel.findById(id);
    if (!project) {
      throw createError({
        statusCode: 404,
        message: "Proyek tidak ditemukan",
      });
    }

    // Delete the associated main image file if it exists
    if (project.image) {
      await deleteFromR2(project.image as string);
    }

    // Delete the project from the database
    await ProjectModel.findByIdAndDelete(id);

    // Return success response
    return {
      statusCode: 200,
      statusMessage: `Proyek "${project.title}" berhasil dihapus`,
    };
  } catch (error: any) {
    // Handle any errors that occur during the process
    return {
      statusCode: error.statusCode || 500,
      statusMessage:
        error.message ||
        "Terjadi kesalahan yang tidak terduga saat menghapus proyek",
    };
  }
});
