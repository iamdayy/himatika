import { PutObjectCommand } from "@aws-sdk/client-s3";
import { MemberModel } from "~~/server/models/MemberModel";
import { ProjectModel } from "~~/server/models/ProjectModel";
import { IMember, IProject } from "~~/types";
import type { IResponse } from "~~/types/IResponse";
const config = useRuntimeConfig();
/**
 * Handles PUT requests for updating an existing project.
 * @param {H3Event} ev - The H3 event object.
 * @returns {Promise<Object>} An object containing the status code and message of the operation.
 * @throws {H3Error} If the user is not authorized, the project is not found, or if a system error occurs.
 */
export default defineEventHandler(async (ev): Promise<IResponse> => {
  try {
    // Ensure the user is authenticated and has the necessary permissions
    const user = ev.context.user;
    if (!user) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be logged in to use this endpoint",
      });
    }
    if (!ev.context.organizer) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be admin / departement to use this endpoint",
      });
    }

    // Get the project ID from the query parameters
    const { id } = getQuery(ev);

    // Read the request body containing the updated project data
    const body = await customReadMultipartFormData<IProject>(ev, {
      allowedTypes: ["image/png", "image/jpeg", "image/webp"],
      compress: {
        quality: 75, // Turunkan kualitas ke 75
        maxWidth: 1000, // Resize lebar maksimal jadi 1000px
      },
      maxFileSize: 2 * 1024 * 1024, // 2MB
    });

    // Find the project by ID
    const project = await ProjectModel.findById(id);
    if (!project) {
      throw createError({
        statusCode: 404,
        statusMessage: "The project is not found",
      });
    }
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
    // Update project fields
    project.title = body.title as any;
    project.category = body.category as any;
    project.image = imageUrl as any;
    project.date = body.date as any;
    project.description = body.description as any;
    project.tags = body.tags as any;
    project.progress = body.progress as any;
    project.published = body.published as any;
    project.url = body.url as any;
    project.publishedAt = body.publishedAt as any;
    project.members = (await Promise.all(
      (JSON.parse(body.members as any) as number[])?.map(
        async (member) => await getIdByNim(member as number)
      )!
    )) as IMember[];

    // Save the updated project
    await project.save();

    // Return success message
    return {
      statusCode: 200,
      statusMessage: `Project ${project.title} updated`,
    };
  } catch (error: any) {
    // Handle any errors that occur during the process
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "An unexpected error occurred",
    };
  }
});

/**
 * Retrieves the member ID associated with a given NIM (Student ID).
 * @param {number} NIM - The Student ID (NIM).
 * @returns {Promise<unknown>} The member ID associated with the given NIM.
 * @throws {H3Error} If the member is not found or if a system error occurs.
 */
const getIdByNim = async (NIM: number): Promise<unknown> => {
  try {
    const member = await MemberModel.findOne({ NIM });
    return member?._id;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode,
      message: error.message,
    });
  }
};
