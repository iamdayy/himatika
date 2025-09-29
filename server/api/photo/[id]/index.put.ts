import { PhotoModel } from "~~/server/models/PhotoModel";
import { IFile } from "~~/types";
import { IReqPhoto } from "~~/types/IRequestPost";
export default defineEventHandler(async (event) => {
  try {
    const { id } = event.context.params as { id: string };
    const body = await readBody<IReqPhoto>(event);
    const photo = await PhotoModel.findById(id);
    if (!photo) {
      throw createError({
        statusCode: 404,
        statusMessage: "Photo not found",
      });
    }
    if (typeof body.image === "string") {
      photo.image = body.image;
    } else {
      const BASE_PHOTO_FOLDER = "/uploads/img/photos";
      let imageUrl = "";
      const image = body.image as IFile;
      // Handle main image upload
      if (image.type?.startsWith("image/")) {
        const hashedName = await storeFileLocally(image, 12, BASE_PHOTO_FOLDER);
        imageUrl = `${BASE_PHOTO_FOLDER}/${hashedName}`;
        photo.image = imageUrl;
      } else {
        throw createError({
          statusMessage: "Please upload nothing but images.",
        });
      }
    }
    photo.title = body.title;
    photo.description = body.description;
    photo.tags = body.tags;
    photo.active = body.active;
    await photo.save();
    return {
      statusCode: 200,
      statusMessage: "Photo updated successfully",
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      statusMessage: "Internal Server Error",
    };
  }
});
