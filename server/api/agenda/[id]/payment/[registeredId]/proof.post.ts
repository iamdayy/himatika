import { uploadToR2, StoragePaths } from "~~/server/utils/storage";
import { AgendaModel } from "~~/server/models/AgendaModel";
import { ParticipantModel } from "~~/server/models/ParticipantModel";
import { CommitteeModel } from "~~/server/models/CommitteeModel";

export default defineEventHandler(async (event) => {
  try {
    const { id, registeredId } = event.context.params as {
      id: string;
      registeredId: string;
    };
    const multipart = await readMultipartFormData(event);

    if (!multipart || multipart.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "No file provided",
      });
    }

    const filePart = multipart.find((p) => p.name === "proof");
    if (!filePart) {
      throw createError({
        statusCode: 400,
        statusMessage: "File part 'proof' not found",
      });
    }

    const agenda = await AgendaModel.findById(id);
    if (!agenda) {
      throw createError({
        statusCode: 404,
        statusMessage: "Agenda not found",
      });
    }

    // Try finding in ParticipantModel first, then CommitteeModel
    let registration = await ParticipantModel.findById(registeredId);
    let isCommittee = false;

    if (!registration) {
      registration = await CommitteeModel.findById(registeredId) as any;
      isCommittee = true;
    }

    if (!registration) {
      throw createError({
        statusCode: 404,
        statusMessage: "Registration not found",
      });
    }

    if (!registration.payment || registration.payment.method !== "manual_transfer") {
      throw createError({
        statusCode: 400,
        statusMessage: "This registration does not use manual transfer",
      });
    }

    if (!filePart.type?.startsWith("image/")) {
      throw createError({
        statusCode: 400,
        statusMessage: "Please upload an image file",
      });
    }

    const fileObj = {
      name: filePart.filename || 'upload.png',
      data: filePart.data,
      type: filePart.type
    };

    const fileUrl = await uploadToR2(fileObj, StoragePaths.AGENDAS(agenda._id.toString(), 'payments', registeredId));

    registration.payment = {
      ...registration.payment,
      proof_url: fileUrl,
      status: "verifying",
    } as any;

    await registration.save();

    return {
      statusCode: 200,
      statusMessage: "Proof uploaded successfully",
      data: {
        payment: registration.payment,
      },
    };
  } catch (error: any) {
    console.error(error);
    return createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    });
  }
});
