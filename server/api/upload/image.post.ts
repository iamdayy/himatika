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

        const MAX_SIZE = 5 * 1024 * 1024;
        if (filePart.data.length > MAX_SIZE) {
            throw createError({ statusCode: 413, statusMessage: 'File size exceeds maximum limit of 5MB' });
        }

        const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!filePart.type || !validMimeTypes.includes(filePart.type)) {
            throw createError({ statusCode: 400, statusMessage: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' });
        }

        let imageUrl = "";

        const fileObj = {
          name: filePart.filename || "signature.png",
          data: filePart.data,
          type: filePart.type
        };
    
        // Handle main image upload
        imageUrl = await uploadToR2(fileObj, 'uploads/signatures');

        return { success: true, url: imageUrl };

    } catch (err: any) {
        throw createError({
            statusCode: err.statusCode || 500,
            statusMessage: err.statusMessage || err.message || 'Upload failed',
        });
    }
});
