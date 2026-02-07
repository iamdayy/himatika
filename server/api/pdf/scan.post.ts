export default defineEventHandler(async (event) => {
    try {
        const config = useRuntimeConfig();
        const files = await readMultipartFormData(event);
        if (!files || files.length === 0) {
           throw createError({ statusCode: 400, statusMessage: "File is required" });
        }
        
        const uploadedFile = files[0];
        const formData = new FormData();
        const blob = new Blob([uploadedFile.data as any], { type: uploadedFile.type });
        formData.append('file', blob, uploadedFile.filename);

        const response = await fetch(`${config.pdf_worker_api_url}/pdf/scan-qr`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
             throw createError({ statusCode: response.status, statusMessage: "Worker Error" });
        }

        const data = await response.json();
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
