import { put } from "@vercel/blob";
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
    const body = await customReadMultipartFormData<IProject>(event);
    const image = body.image as File;
    let imageUrl = "";
    if (image) {
      const BASE_PHOTO_FOLDER = "/uploads/img/projects/";
      const image = body.image as File;
      const fileName = `${BASE_PHOTO_FOLDER}/${image.name}.${
        image.type.split("/")[1]
      }`;

      // Handle main image upload
      if (image.type?.startsWith("image/")) {
        const { url } = await put(fileName, image, {
          access: "public",
        });
        imageUrl = url;
      } else {
        throw createError({
          statusMessage: "Please upload nothing but images.",
        });
      }
    }

    // Create a new project instance with mapped members
    const project = new ProjectModel({
      ...body,
      image: imageUrl,
      members: await Promise.all(
        (JSON.parse(body.members) as number[])?.map(
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
