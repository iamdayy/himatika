export default defineEventHandler(async (event) => {
    try {
        const config = useRuntimeConfig();
        const files = await readMultipartFormData(event);
        if (!files || files.length === 0) {
           throw createError({ statusCode: 400, statusMessage: "File is required" });
        }
        
        const uploadedFile = files[0];
        if (!uploadedFile) {
            throw createError({ statusCode: 400, statusMessage: "File is required" });
        }
        const formData = new FormData();
        const blob = new Blob([uploadedFile.data as any], { type: uploadedFile.type });
        formData.append('file', blob, uploadedFile.filename);

        const response = await fetch(`${config.pdf_worker_api_url}/pdf/certificate-preview`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
             const errorData = await response.json();
             throw createError({ statusCode: response.status, statusMessage: errorData.error || "Worker Error" });
        }

        const data = await response.json();
        return data; // Worker returns { success, url, pdfUrl, width, height }

    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || "Internal Server Error"
        });
    }
});
