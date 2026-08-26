import { pdfWorkerFetch } from "~~/server/utils/himatikaPdfWorker";

export default defineEventHandler(async (event) => {
    try {
        const files = await readMultipartFormData(event);
        if (!files || files.length === 0) {
           throw createError({ statusCode: 400, statusMessage: "File is required" });
        }
        
        const uploadedFile = files[0];
        if (!uploadedFile || !uploadedFile.data) {
           throw createError({ statusCode: 400, statusMessage: "Invalid file data" });
        }
        const formData = new FormData();
        const blob = new Blob([uploadedFile.data as any], { type: uploadedFile.type });
        formData.append('file', blob, uploadedFile.filename);

        // Authenticated + path-normalized worker call (raw fetch here sent no
        // service token and could double-prefix /api).
        const data = await pdfWorkerFetch<any>("/api/pdf/scan-qr", {
            method: 'POST',
            body: formData
        });
        return {
            statusCode: 200,
            statusMessage: "Success",
            data
        };

    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || "Internal Server Error"
        });
    }
});
