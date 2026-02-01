import ExcelJS from "exceljs";

const config = useRuntimeConfig();

interface DataRow {
  [key: string]: string | number | boolean | object | null;
}

/**
 * Flattens a nested JSON object into a single-level object.
 * @param {Record<string, any>} obj - The object to flatten.
 * @param {string} prefix - The prefix to use for nested keys (default: "").
 * @returns {Record<string, any>} A flattened object.
 */
function flattenObject(
  obj: Record<string, any>,
  prefix = ""
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in obj) {
    const value = obj[key];
    const keyNotAllow = ["_id", "id", "__v", "createdAt", "updatedAt"];
    if (keyNotAllow.includes(key)) {
      continue;
    }

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value));
    } else {
      result[key] = value;
    }
  }
  return result;
}

function toTitleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * Handles POST requests for exporting data to Excel.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<Blob|Object>} A Blob containing the Excel file or an error object.
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const complexData: DataRow[] = body.data;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(body.title);

    // Get all possible headers from the data

    if (body.headers) {
      worksheet.columns = body.headers;
      complexData.forEach((item) => {
        const flattenedItem = flattenObject(item);
        worksheet.addRow(flattenedItem);
      });
    } else {
      let allHeaders = new Set<string>();
      complexData.forEach((item) => {
        Object.keys(flattenObject(item)).forEach((header) =>
          allHeaders.add(header)
        );
      });
      // Add column headers
      worksheet.addRow(Array.from(allHeaders));
      // Add data rows
      complexData.forEach((item) => {
        const flattenedItem = flattenObject(item);
        const rowValues = Array.from(allHeaders).map(
          (header) => flattenedItem[header] ?? ""
        );
        worksheet.addRow(rowValues);
      });
    }

    const title = `${body.title}-${new Date()
      .toString()
      .replace(/:/g, "-")
      .replace(/ /g, "-")}.xlsx`;
    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    setResponseHeaders(event, {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
        title
      )}`,
    });

    event.node.res.end(Buffer.from(buffer));
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    setResponseStatus(event, 500); // Internal Server Error
    return {
      statusCode: 500,
      statusMessage: "Gagal mengekspor ke Excel",
    };
  }
});
