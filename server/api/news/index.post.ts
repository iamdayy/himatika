import { PutObjectCommand } from "@aws-sdk/client-s3";
import { Types } from "mongoose";
import { MemberModel } from "~~/server/models/MemberModel";
import { NewsModel } from "~~/server/models/NewsModel";
import { INews } from "~~/types";
import { IReqNews } from "~~/types/IRequestPost";
import type { IResponse } from "~~/types/IResponse";

/**
 * Handles NEWS requests for creating a new news.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<Object>} An object containing the status code and message of the operation.
 * @throws {H3Error} If the user is not authorized, file upload fails, or if a system error occurs.
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
    if (!event.context.organizer) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be admin / departement to use this endpoint",
      });
    }

    const BASE_MAINIMAGE_FOLDER = "/uploads/img/newss";
    let imageUrl = "";

    const body = await customReadMultipartFormData<IReqNews>(event, {
      allowedTypes: ["image/png", "image/jpeg", "image/webp"],
      compress: {
        quality: 75, // Turunkan kualitas ke 75% (cukup bagus untuk web)
        maxWidth: 1000, // Resize lebar maksimal jadi 1000px
      },
      maxFileSize: 2 * 1024 * 1024, // 2MB
    });
    const file = body.mainImage;
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
    const fileName = `${BASE_MAINIMAGE_FOLDER}/${hashText(file.name!)}.${
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

    const authorsIds = body.authors
      ? await getAuthorsIds(JSON.parse(body.authors as string))
      : [];

    // Prepare news data
    const newNews: INews = {
      title: body.title as string,
      body: body.body as string,
      category: body.category as string,
      slug: (body.title as string)
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, ""),
      mainImage: imageUrl,
      authors: authorsIds,
    };

    // Create and save the new news
    const news = new NewsModel(newNews);
    const saved = await news.save();
    if (!saved) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to add new News ${news.title}`,
      });
    }

    return {
      statusCode: 200,
      statusMessage: `Success to add new News ${news.title}`,
    };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage:
        error.message || "An unexpected error occurred while creating the news",
    };
  }
});

/**
 * Retrieves the user's ID by their NIM (Nomor Induk Mahasiswa).
 * @param {number} NIM - The user's NIM.
 * @returns {Promise<Types.ObjectId | undefined>} The user's ID or undefined if not found.
 * @throws {H3Error} If an error occurs during the database query.
 */
const getIdByNim = async (NIM: number): Promise<Types.ObjectId | undefined> => {
  try {
    const member = await MemberModel.findOne({ NIM });
    return member?._id as Types.ObjectId;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve user ID by NIM",
    });
  }
};

async function getAuthorsIds(authors: number[]): Promise<Types.ObjectId[]> {
  return Promise.all(
    authors.map(async (author) => {
      try {
        return (await getIdByNim(author)) as Types.ObjectId;
      } catch (error) {
        console.error(`Error getting ID for author ${author}:`, error);
        throw error; // or handle the error as needed
      }
    })
  );
}
