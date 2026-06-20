import { ProjectModel } from "~~/server/models/ProjectModel";
import { IProject } from "~~/types";
import { IResponse } from "~~/types/IResponse";
import { uploadToR2, StoragePaths } from "~~/server/utils/storage";

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
        statusMessage: "Anda harus login untuk menggunakan endpoint ini",
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
      // Handle main image upload
      if (file.type?.startsWith("image/")) {
        imageUrl = await uploadToR2(file, StoragePaths.PROJECTS());
      } else {
        throw createError({
          statusMessage: "Harap unggah gambar saja.",
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
        statusMessage: `Gagal menambahkan Proyek baru ${project.title}`,
      };
    }
    // Return success message
    return {
      statusCode: 200,
      statusMessage: `Berhasil menambahkan Proyek baru ${project.title}`,
    };
  } catch (error: any) {
    // Handle any errors that occur during the process
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Terjadi kesalahan yang tidak terduga",
    };
  }
});
