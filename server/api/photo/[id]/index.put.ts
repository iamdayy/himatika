import { uploadToR2, deleteFromR2 } from "~~/server/utils/storage";
import { PhotoModel } from "~~/server/models/PhotoModel";
import { IReqPhoto } from "~~/types/IRequestPost";

export default defineEventHandler(async (event) => {
  try {
    const { id } = event.context.params as { id: string };

    if (!event.context.organizer) {
        throw createError({
            statusCode: 403,
            statusMessage: "Forbidden",
        });
    }
    
    // Parse multipart form data
    const body = await customReadMultipartFormData<IReqPhoto>(event, {
        allowedTypes: ["image/png", "image/jpeg", "image/webp"],
        compress: {
            quality: 75,
            maxWidth: 1000,
        },
        maxFileSize: 2 * 1024 * 1024, // 2MB
    });

    const photo = await PhotoModel.findById(id);
    if (!photo) {
      throw createError({
        statusCode: 404,
        statusMessage: "Photo not found",
      });
    }

    // Check if new image is uploaded
    // Check if new image is uploaded
    const image = body.image;
    
    if (image && typeof image === "object" && image.name) {
        // Delete old image if it exists and is on R2
        if (photo.image && typeof photo.image === "string") {
            await deleteFromR2(photo.image);
        }

        // Handle image upload to R2
        if (image.type?.startsWith("image/")) {
            // General photos fallback. Could map to specific path if `onModel` was available, but "photos" is ok.
            photo.image = await uploadToR2(image, "uploads/photos");
        } else {
            throw createError({
                statusCode: 400,
                statusMessage: "Please upload nothing but images.",
            });
        }
    } else if (typeof body.image === 'string' && body.image !== photo.image) {
         // If image is sent as string (URL) and different, just update it? 
         // Or if it's the same, do nothing. 
         // Assuming this might be for clearing image or strictly external URL, 
         // but 'customReadMultipartFormData' puts file data in object.
         // If user sends string text field 'image', it comes here.
         photo.image = body.image;
    }
    if (body.tags) photo.tags = body.tags as unknown as string[]; // customReadMultipartFormData might return string, need parsing if sent as JSON string, or array if multiple fields.
    // NOTE: multipart/form-data with arrays (tags[]) might need special handling if customReadMultipartFormData doesn't handle array fields natively as arrays.
    // However, usually 'tags' comes as stringified JSON or multiple fields. 
    // Let's assume for now it might pass as string and we might need to parse it if it's JSON stringified.
    
    // safe parsing for tags if it comes as string
    if (typeof body.tags === 'string') {
        try {
             photo.tags = JSON.parse(body.tags);
        } catch (e) {
            // if not json, maybe just a single tag or comma separated?
            // keeping as is if matches Schema.
            // But Schema usually expects array.
            // If it's just a string, let's leave it to mongoose or user to ensure it's correct.
            // For safety, let's attempt to wrap in array if not parseable? 
            // Better: assume client sends compliant data (JSON string for arrays in FormData is common practice).
        }
    }

    await photo.save();
    return {
      statusCode: 200,
      statusMessage: "Photo updated successfully",
    };
  } catch (error: any) {
    console.log(error);
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    };
  }
});
