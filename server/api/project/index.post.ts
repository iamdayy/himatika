import { PutObjectCommand } from "@aws-sdk/client-s3";
import { ProjectModel } from "~~/server/models/ProjectModel";
import { IProject } from "~~/types";
import { IResponse } from "~~/types/IResponse";
/**
 * Handles POST requests for creating a new project.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<Object>} An object containing the status code and message of the operation.
 * @throws {H3Error} If the user is not authorized, the project is not saved, or if a system error occurs.
 */
export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    // Ensure the user is authenticated and has the necessary permissions
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be logged in to use this endpoint",
      });
    }

    // Read the request body containing the project data
    const body = await customReadMultipartFormData<IProject>(event, {
      allowedTypes: ["image/png", "image/jpeg", "image/webp"],
      compress: {
        quality: 75, // Turunkan kualitas ke 75
        maxWidth: 1000, // Resize lebar maksimal jadi 1000px
      },
      maxFileSize: 2 * 1024 * 1024, // 2MB
    });
    const file = body.image;
    let imageUrl = "";
    if (file && typeof file !== "string") {
      const BASE_PHOTO_FOLDER = "/uploads/img/projects/";
      const fileName = `${BASE_PHOTO_FOLDER}/${file.name}.${
        file.type?.split("/")[1]
      }`;

      // Handle main image upload
      if (file.type?.startsWith("image/")) {
        await r2Client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: fileName,
            Body: file.data,
            ContentType: file.type,
          })
        );
        imageUrl = `${R2_PUBLIC_DOMAIN}/${fileName}`;
      } else {
        throw createError({
          statusMessage: "Please upload nothing but images.",
        });
      }
    }

    // Create a new project instance with mapped members
    const project = new ProjectModel({
      ...body,
      tags: typeof body.tags === "string" ? JSON.parse(body.tags as string) : body.tags,
      image: imageUrl,
      members: await Promise.all(
        (JSON.parse(body.members as any) as number[])?.map(
          async (member) => await findMemberByNim(member as number)
        )!
      ),
    });

    // Save the new project to the database
    const saved = await project.save();
    if (!saved) {
      return {
        statusCode: 400,
        statusMessage: `Failed to add new Project ${project.title}`,
      };
    }
    // Return success message
    return {
      statusCode: 200,
      statusMessage: `Success to add new Project ${project.title}`,
    };
  } catch (error: any) {
    // Handle any errors that occur during the process
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "An unexpected error occurred",
    };
  }
});
