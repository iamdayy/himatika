import { MultiPartData } from "h3";
import { DocModel } from "~~/server/models/DocModel";
import { IDoc, ISign } from "~~/types";
// Import S3 Command dan Utility yang baru kita buat
import { PutObjectCommand } from "@aws-sdk/client-s3";

export default defineEventHandler(async (event) => {
  try {
    const data = await customReadMultipartFormData<IDoc>(event, {
      allowedTypes: ["application/pdf"],
      maxFileSize: 3 * 1024 * 1024, // 3MB
    });

    // Ubah base folder (S3/R2 biasanya tidak menyarankan diawali garis miring '/')
    const BASE_DOC_FOLDER = `uploads/doc`;

    const user = event.context.user;
    if (!user) {
      throw createError({
        statusMessage: "Unauthorized",
      });
    }

    const d = data.doc as MultiPartData;

    // Buat nama file (Key) untuk R2
    const fileKey = `${BASE_DOC_FOLDER}/${user.member.NIM}/${d.name!}`;

    // Upload ke R2
    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileKey,
        Body: d.data, // Buffer data dari file
        ContentType: d.type, // Penting agar browser tahu ini gambar/pdf
        // ACL: "public-read" // R2 biasanya mengatur akses via pengaturan bucket/domain, bukan di sini, tapi bisa dibiarkan default.
      })
    );

    // Buat URL Publik Manual
    // URL Vercel Blob otomatis digenerate, tapi di R2 kita gabungkan domain + fileKey
    const url = `${process.env.R2_PUBLIC_DOMAIN}/${fileKey}`;

    data.doc = url;
    // ----------------------------------------------

    const saved = await DocModel.create({
      label: data.label as string,
      doc: url,
      no: data.no as string,
      signs: await Promise.all(
        await JSON.parse(data.signs as string).map(async (sign: ISign) => {
          const memberId = await findMemberByNim(sign.user as number);
          if (!memberId) {
            throw createError({
              statusCode: 404,
              statusMessage: "Member not found",
            });
          }
          return {
            ...sign,
            user: memberId,
          };
        })
      ),
      trails: [
        {
          user: user.member._id,
          action: "CREATE",
        },
      ],
      tags: data.tags ? JSON.parse(data.tags as string) : [],
      uploader: user.member._id,
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
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      statusMessage: "Internal Server Error",
    };
  }
});
