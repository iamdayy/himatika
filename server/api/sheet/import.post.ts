
import { ParsedFile } from "~~/server/utils/customReadMultipartFormData";
import { pdfWorkerFetch } from "~~/server/utils/himatikaPdfWorker";
/**
 * Represents a row of data from the Excel sheet.
 */
interface DataRow {
  [key: string]: string | number | boolean | object | null;
}

/**
 * Handles POST requests for importing Excel data.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<DataRow[]|Error>} An array of imported data rows or an error.
 */
export default defineEventHandler(async (event) => {
  try {
    // Read the uploaded file
    const { file } = await customReadMultipartFormData<{ file: ParsedFile }>(
      event,
      {
        allowedTypes: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        maxFileSize: 10 * 1024 * 1024, // 10MB
      }
    );

    if (!file) {
      throw createError({
        statusCode: 402,
        statusMessage: "Harap lampirkan berkas dalam formulir",
      });
    }

    // Call Worker
    const formData = new FormData();
    const uploadedFile = file as ParsedFile;
    const blob = new Blob([new Uint8Array(uploadedFile.data)], { type: uploadedFile.type });
    formData.append('file', blob, uploadedFile.name);

    const result = await pdfWorkerFetch<{ data: DataRow[] }>("/api/sheet/import", {
        method: 'POST',
        body: formData
    });

    return {
      statusCode: 200,
      statusMessage: "Data berhasil diimpor",
      data: result.data,
    };
  } catch (error: any) {
    // Re-throw real HTTP errors instead of resolving with an error object.
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || "Gagal mengimpor data",
    });
  }
});
