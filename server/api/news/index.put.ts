import { PutObjectCommand } from "@aws-sdk/client-s3";
import { Types } from "mongoose";
import { MemberModel } from "~~/server/models/MemberModel";
import { NewsModel } from "~~/server/models/NewsModel";
import { IReqNews } from "~~/types/IRequestPost";
import type { IResponse } from "~~/types/IResponse";
const config = useRuntimeConfig();

/**
 * Handles PUT requests for updating an existing news.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<Object>} An object containing the status code and message of the operation.
 * @throws {H3Error} If the user is not authorized, the news is not found, or if a system error occurs.
 */
export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const { slug } = getQuery(event);
    const BASE_MAINIMAGE_FOLDER = "/uploads/img/newss";
    let imageUrl = "";

    // Check user authorization
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

    // Find the news by slug
    const news = await NewsModel.findOne({ slug });
    if (!news) {
      throw createError({
        statusCode: 404,
        message: "News not found",
      });
    }

    const body = await customReadMultipartFormData<IReqNews>(event);
    const file = body.mainImage;
    // Handle main image upload
    if (file && typeof file !== "string") {
      if (file.type?.startsWith("image/")) {
        // Remove old image if it exists
        const fileName = `${BASE_MAINIMAGE_FOLDER}/${hashText(file.name!)}.${
          file.type.split("/")[1] || "png"
        }`;
        // Save new
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
        imageUrl = news.mainImage as string;
      }
    } else {
      imageUrl = news.mainImage as string;
    }

    const authorsIds = body.authors
      ? await getAuthorsIds(JSON.parse(body.authors as string))
      : [];

    // Update news properties
    news.title = body.title as string;
    news.mainImage = imageUrl;
    news.slug = (body.title as string)
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
    news.category = body.category as string;
    // news.tags = body.tags as string;
    news.body = body.body as string;
    news.authors = authorsIds;

    // Save the updated news
    const saved = await news.save();

    if (!saved) {
      return {
        statusCode: 400,
        statusMessage: `Failed to save news ${news.title}`,
      };
    }

    return {
      statusCode: 200,
      statusMessage: `Success to save news ${news.title}`,
    };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage:
        error.message || "An unexpected error occurred while updating the news",
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
