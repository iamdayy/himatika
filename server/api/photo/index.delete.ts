import { deleteFromR2 } from "~~/server/utils/storage";
import { PhotoModel } from "~~/server/models/PhotoModel";
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
        statusMessage: "ID foto tidak disertakan",
      });
    }

    const photo = await PhotoModel.findById(id).populate("uploader");
    if (!photo) {
      throw createError({
        statusCode: 404,
        statusMessage: "Foto tidak ditemukan",
      });
    }

    const isOrganizer = event.context.organizer;
    let isCommittee = false;

    if (!isOrganizer && photo.onModel === "Agenda") {
      const { CommitteeModel } = await import("~~/server/models/CommitteeModel");
      const isRegisteredCommittee = await CommitteeModel.findOne({
        agendaId: photo.on as any,
        member: user.member._id as any,
      });
      isCommittee = !!isRegisteredCommittee;
    }

    const uploaderNIM = (photo.uploader as any)?.NIM;
    const isUploader = uploaderNIM === user.member.NIM;

    if (!isOrganizer && !isCommittee && !isUploader) {
      throw createError({
        statusCode: 403,
        statusMessage: "Anda tidak berhak menghapus foto ini",
      });
    }

    // Delete the associated main image file if it exists
    if (photo.image) {
      await deleteFromR2(photo.image as string);
    }
    await PhotoModel.findByIdAndDelete(id);

    return { statusCode: 200, statusMessage: "Foto berhasil dihapus" };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Terjadi Kesalahan Server",
    };
  }
});
