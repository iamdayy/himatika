import { uploadToR2, StoragePaths } from "~~/server/utils/storage";

/**
 * POST /api/upload/image
 * Upload a signature image to R2 via Python worker.
 * Accepts multipart/form-data with field name 'file'.
 */
export default defineEventHandler(async (event) => {
    try {
        const user = event.context.user;
        if (!user) {
            throw createError({ statusCode: 401, statusMessage: "You must be logged in to upload files" });
        }

        const files = await readMultipartFormData(event);
        if (!files || files.length === 0) {
            throw createError({ statusCode: 400, statusMessage: 'File required' });
        }

        const filePart = files.find(p => p.name === 'file') ?? files[0];
        if (!filePart?.data) {
            throw createError({ statusCode: 400, statusMessage: 'File required' });
        }

        let imageUrl = "";

        const fileObj = {
          name: filePart.filename || "signature.png",
          data: filePart.data,
          type: filePart.type
        };
    
        // Handle main image upload
        if (filePart.type?.startsWith("image/")) {
          // This upload api seems specifically for signatures
          imageUrl = await uploadToR2(fileObj, 'uploads/signatures');
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
