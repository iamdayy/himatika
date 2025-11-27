import ExcelJS from "exceljs";
import { ParsedFile } from "~~/server/utils/customReadMultipartFormData";
const config = useRuntimeConfig();
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
      event
    );

    if (!file) {
      throw createError({
        statusCode: 402,
        statusMessage: "Please attach file in the form",
      });
    }
    // Read the Excel workbook
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load((file as ParsedFile).data);
    const worksheet = workbook.getWorksheet("template");

    const jsonData: DataRow[] = [];
    const headers: string[] = [];

    // Extract column headers
    worksheet?.getRow(1).eachCell((cell) => {
      headers.push(cell.value as string);
    });

    // Process each row of data
    worksheet?.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 1) {
        // Skip the header row
        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          const nestedKeys = header.split(".");
          let currentObject = rowData;

          // Handle nested headers
          for (let i = 0; i < nestedKeys.length - 1; i++) {
            const key = nestedKeys[i];
            if (!currentObject[key]) {
              currentObject[key] = {};
            }
            currentObject = currentObject[key];
          }

          // Set the value for the deepest nested key
          currentObject[nestedKeys[nestedKeys.length - 1]] = cell.value;
        });
        jsonData.push(rowData as DataRow);
      }
    });

    return {
      statusCode: 200,
      statusMessage: "Data imported successfully",
      data: jsonData,
    };
  } catch (error) {
    return error;
  }
});
