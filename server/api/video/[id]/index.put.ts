// import { VideoModel } from "~~/server/models/VideoModel";
// import { IFile } from "~~/types";
// import { IReqVideo } from "~~/types/IRequestPost";
// export default defineEventHandler(async (event) => {
//   try {
//     const { id } = event.context.params as { id: string };
//     const body = await readBody<IReqVideo>(event);
//     const video = await VideoModel.findById(id);
//     if (!video) {
//       throw createError({
//         statusCode: 404,
//         statusMessage: "Video not found",
//       });
//     }
//     if (typeof body.video === "string") {
//       video.video = body.video;
//     } else {
//       const BASE_VIDEO_FOLDER = "/uploads/img/videos";
//       let videoUrl = "";
//       const video = body.video as IFile;
//       // Handle main video upload
//       if (video.type?.startsWith("video/")) {
//         const hashedName = await storeFileLocally(video, 12, BASE_VIDEO_FOLDER);
//         videoUrl = `${BASE_VIDEO_FOLDER}/${hashedName}`;
//         video = videoUrl;
//       } else {
//         throw createError({
//           statusMessage: "Please upload nothing but videos.",
//         });
//       }
//     }
//     video.title = body.title;
//     video.description = body.description;
//     video.tags = body.tags;
//     video.active = body.active;
//     await video.save();
//     return {
//       statusCode: 200,
//       statusMessage: "Video updated successfully",
//     };
//   } catch (error) {
//     console.log(error);
//     return {
//       statusCode: 500,
//       statusMessage: "Internal Server Error",
//     };
//   }
// });
