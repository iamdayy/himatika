import { deleteFromR2 } from "~~/server/utils/storage";
import { VideoModel } from "~~/server/models/VideoModel";
import { IResponse } from "~~/types/IResponse";
import { IMember } from "~~/types";

const config = useRuntimeConfig();
export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 403,
        statusMessage: "Anda harus login untuk menggunakan endpoint ini",
      });
    }
    
    const { id } = getQuery(event);
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID video tidak disertakan",
      });
    }

    const video = await VideoModel.findById(id).populate("uploader");
    if (!video) {
      throw createError({
        statusCode: 404,
        statusMessage: "Video tidak ditemukan",
      });
    }

    const isOrganizer = event.context.organizer;
    let isCommittee = false;

    if (!isOrganizer && video.onModel === "Agenda") {
      const { CommitteeModel } = await import("~~/server/models/CommitteeModel");
      const isRegisteredCommittee = await CommitteeModel.findOne({
        agendaId: video.on as any,
        member: user.member._id as any,
      });
      isCommittee = !!isRegisteredCommittee;
    }

    const uploaderNIM = (video.uploader as any)?.NIM;
    const isUploader = uploaderNIM === user.member.NIM;

    if (!isOrganizer && !isCommittee && !isUploader) {
      throw createError({
        statusCode: 403,
        statusMessage: "Anda tidak berhak menghapus video ini",
      });
    }

    // Delete the associated main video file if it exists
    if (video.video) {
      await deleteFromR2(video.video as string);
    }
    await VideoModel.findByIdAndDelete(id);

    return { statusCode: 200, statusMessage: "Video berhasil dihapus" };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Terjadi Kesalahan Server",
    };
  }
});
