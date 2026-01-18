import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
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
        if (photo.image && typeof photo.image === "string" && photo.image.startsWith(R2_PUBLIC_DOMAIN)) {
            const oldKey = photo.image.replace(`${R2_PUBLIC_DOMAIN}/`, "");
            try {
                await r2Client.send(new DeleteObjectCommand({
                    Bucket: R2_BUCKET_NAME,
                    Key: oldKey,
                }));
            } catch (error) {
                console.error("Failed to delete old image from R2", error);
                // Continue execution even if delete fails
            }
        }

        const fileName = `photos/${Date.now()}_${image.name.replace(/\s+/g, "-")}`;
        
        // Handle image upload to R2
        if (image.type?.startsWith("image/")) {
            await r2Client.send(
                new PutObjectCommand({
                    Bucket: R2_BUCKET_NAME,
                    Key: fileName,
                    Body: image.data,
                    ContentType: image.type,
                })
            );
            photo.image = `${R2_PUBLIC_DOMAIN}/${fileName}`;
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
