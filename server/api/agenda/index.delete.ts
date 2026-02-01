import { AgendaModel } from "~~/server/models/AgendaModel";
import { PhotoModel } from "~~/server/models/PhotoModel";
import { IError, IResponse } from "~~/types/IResponse";
/**
 * Handles DELETE requests for removing an agenda.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<boolean>} True if the agenda was successfully deleted.
 * @throws {H3Error} If the event is not found or if a system error occurs.
 */
export default defineEventHandler(
  async (event): Promise<IResponse | IError> => {
    try {
      const user = event.context.user;
      const organizer = event.context.organizer;
      if (!user) {
        throw createError({
          statusCode: 403,
          statusMessage: "Anda harus login untuk menggunakan endpoint ini",
        });
      }
      if (!organizer) {
        throw createError({
          statusCode: 403,
          statusMessage: "Anda harus menjadi admin / departemen untuk menggunakan endpoint ini",
        });
      }
      // Get the agenda ID from the route parameters
      const { id } = getQuery<{ id: string }>(event);

      // Attempt to find and delete the agenda
      const deleted = await AgendaModel.findByIdAndDelete(id);
      await PhotoModel.deleteMany({ on: id });

      // If the agenda wasn't found, throw an error
      if (!deleted) {
        throw createError({
          statusCode: 404,
          message: "Agenda tidak ditemukan atau sudah dihapus",
        });
      }

      // Return true to indicate successful deletion
      return {
        statusCode: 200,
        statusMessage: "Agenda berhasil dihapus",
      };
    } catch (error: any) {
      // Handle any errors that occur during the process
      return {
        statusCode: error.statusCode || 500,
        statusMessage:
          error.message ||
          "Terjadi kesalahan yang tidak terduga saat menghapus agenda",
      };
    }
  }
);
