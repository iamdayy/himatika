import { PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * POST /api/upload/image
 * Upload a signature image to R2 via Python worker.
 * Accepts multipart/form-data with field name 'file'.
 */
export default defineEventHandler(async (event) => {
    try {

        const files = await readMultipartFormData(event);
        if (!files || files.length === 0) {
            throw createError({ statusCode: 400, statusMessage: 'File required' });
        }

        const filePart = files.find(p => p.name === 'file') ?? files[0];
        if (!filePart?.data) {
            throw createError({ statusCode: 400, statusMessage: 'File required' });
        }

        const BASE_PHOTO_FOLDER = `/signature`;
            let imageUrl = "";
            const file = filePart.data;
            if (!file) {
              throw createError({
                statusCode: 400,
                statusMessage: "No file uploaded",
              });
            }
            if (typeof file === "string") {
              throw createError({
                statusCode: 400,
                statusMessage: "Invalid file data",
              });
            }
        
            const fileName = `${BASE_PHOTO_FOLDER}/${hashText(`${filePart.filename}`)}.${
              filePart.type?.split("/")[1] || "png"
            }`;
        
            // Handle main image upload
            if (filePart.type?.startsWith("image/")) {
              await r2Client.send(
                new PutObjectCommand({
                  Bucket: R2_BUCKET_NAME,
                  Key: fileName,
                  Body: filePart.data,
                  ContentType: filePart.type,
                })
              );
        
              imageUrl = `${R2_PUBLIC_DOMAIN}/${fileName}`;
            } else {
              throw createError({
                statusMessage: "Please upload nothing but images.",
              });
            }


        return { success: true, url: imageUrl };

    } catch (err: any) {
        throw createError({
            statusCode: err.statusCode || 500,
            statusMessage: err.statusMessage || err.message || 'Upload failed',
        });
    }
});
