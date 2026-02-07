
const config = useRuntimeConfig();

interface DataRow {
  [key: string]: string | number | boolean | object | null;
}

/**
 * Handles POST requests for exporting data to Excel.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<Blob|Object>} A Blob containing the Excel file or an error object.
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    // Call Worker
    const response = await fetch(`${config.pdf_worker_api_url}/sheet/export`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`Worker Error: ${response.statusText}`);
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const title = `${body.title}-${new Date()
      .toString()
      .replace(/:/g, "-")
      .replace(/ /g, "-")}.xlsx`;

    setResponseHeaders(event, {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
        title
      )}`,
    });

    event.node.res.end(buffer);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    setResponseStatus(event, 500); // Internal Server Error
    return {
      statusCode: 500,
      statusMessage: "Gagal mengekspor ke Excel",
    };
  }
});
