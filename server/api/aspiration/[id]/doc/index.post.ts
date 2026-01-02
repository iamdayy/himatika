import { PutObjectCommand } from "@aws-sdk/client-s3";
import { Types } from "mongoose";
import { AspirationModel } from "~~/server/models/AspirationModel";
import { DocModel } from "~~/server/models/DocModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { IMember } from "~~/types";
import { IReqAspirationDoc } from "~~/types/IRequestPost";
import { IResponse } from "~~/types/IResponse";
export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const {
      doc: file,
      label,
      tags,
      no,
    } = await customReadMultipartFormData<IReqAspirationDoc>(event, {
      allowedTypes: ["application/pdf"],
      maxFileSize: 3 * 1024 * 1024, // 2MB
    });

    const { id } = event.context.params as { id: string };
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusMessage: "Unauthorized",
      });
    }
    const aspiration = await AspirationModel.findById(id);
    if (!aspiration) {
      return {
        statusCode: 404,
        statusMessage: "Aspiration not found",
      };
    }

    if ((aspiration.from as IMember).NIM !== user.member.NIM) {
      throw createError({
        statusMessage: "Unauthorized",
      });
    }
    const BASE_DOC_FOLDER = `/uploads/img/aspiration/${aspiration._id}/docs`;
    let docUrl = "";
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
    const fileName = `${BASE_DOC_FOLDER}/${hashText(file.name!)}.${
      file.type?.split("/")[1]
    }`;
    // Handle main doc upload
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileName,
        Body: file.data,
        ContentType: file.type,
      })
    );
    docUrl = `${R2_PUBLIC_DOMAIN}/${fileName}`;
    const saved = await DocModel.create({
      label: label as string,
      on: aspiration._id,
      onModel: "Aspiration",
      no: no as string,
      tags: tags ? JSON.parse(tags as string) : [],
      doc: docUrl,
      uploader: (await getIdByNim(user.member.NIM)) as Types.ObjectId,
    });
    if (!saved) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to save doc",
      });
    }
    return {
      statusCode: 200,
      statusMessage: "Doc added successfully",
    };
  } catch (error: any) {
    console.error(error);
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
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
