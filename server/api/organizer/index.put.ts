import { MemberModel } from "~~/server/models/MemberModel";
import OrganizerModel from "~~/server/models/OrganizerModel";
import { deleteFromR2, StoragePaths, uploadToR2 } from "~~/server/utils/storage";
import { IOrganizer } from "~~/types";
import { IResponse } from "~~/types/IResponse";
const config = useRuntimeConfig();
export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Anda harus login untuk menggunakan endpoint ini",
      });
    }
    if (!event.context.organizer) {
      throw createError({
        statusCode: 403,
        statusMessage: "Anda harus menjadi admin / departemen untuk menggunakan endpoint ini",
      });
    }

    const chairmanText = [
      "ketua",
      "wakil ketua",
      "ketua umum",
      "chairman",
      "vice chairman",
      "ketua himpunan",
      "wakil ketua himpunan"
    ];
    const isChairman = chairmanText.includes(
      event.context.organizer?.role.toLowerCase() || ""
    );
    if (!isChairman) {
      throw createError({
        statusCode: 403,
        statusMessage: "Anda harus menjadi ketua untuk menggunakan endpoint ini",
      });
    }
    const { period } = getQuery<{ period: string }>(event);
    const [startYear, endYear] = period.split("-").map(Number);
    const organizer = await OrganizerModel.findOne({
      $expr: {
        $and: [
          { $gte: [{ $year: "$period.start" }, startYear] },
          { $lte: [{ $year: "$period.end" }, endYear] },
        ],
      },
    });
    if (!organizer) {
      throw createError({
        statusCode: 404,
        statusMessage: "Pengurus tidak ditemukan",
      });
    }

    const uploadedData = await customReadMultipartFormData<any>(event, {
      allowedTypes: ["image/png", "image/jpeg", "image/webp"],
      compress: {
        quality: 75,
        maxWidth: 1000,
      },
      maxFileSize: 2 * 1024 * 1024, // 2MB
    });

    if (!uploadedData.organizerData) {
      throw createError({
        statusCode: 400,
        statusMessage: "Data pengurus tidak ditemukan",
      });
    }

    const organizerDataStr =
      typeof uploadedData.organizerData === "string"
        ? uploadedData.organizerData
        : uploadedData.organizerData.data.toString();

    const body = JSON.parse(organizerDataStr) as IOrganizer;

    const councilPromises = body.council.map(async (council, index) => {
      const filePart = uploadedData[`council-image-${index}`];
      let imageUrl = council.image;

      if (filePart && typeof filePart !== "string") {
        // Delete old image if exists
        if (organizer.council[index] && organizer.council[index].image) {
          try {
            await deleteFromR2(organizer.council[index].image as string);
          } catch (e) {
            console.warn("Failed to delete old image", e);
          }
        }

        imageUrl = await uploadToR2(filePart, StoragePaths.ORGANIZERS);
      }
      return {
        position: council.position,
        name: council.name,
        image: imageUrl,
      };
    });

    const advisorFilePart = uploadedData["advisor-image"];
    let imageUrlAdvisor = body.advisor.image;

    if (advisorFilePart && typeof advisorFilePart !== "string") {
      // Delete old advisor image if exists
      if (organizer.advisor && organizer.advisor.image) {
        try {
          await deleteFromR2(organizer.advisor.image as string);
        } catch (e) {
          console.warn("Failed to delete old advisor image", e);
        }
      }

      imageUrlAdvisor = await uploadToR2(advisorFilePart, StoragePaths.ORGANIZERS);
    }

    const advisor = {
      position: body.advisor.position,
      name: body.advisor.name,
      image: imageUrlAdvisor,
    };

    const considerationBoardPromises = body.considerationBoard.map(
      async (member) => {
        return await getMemberIdByNim(member as number);
      }
    );

    const dailyManagementPromises = body.dailyManagement.map(async (daily) => {
      const memberId = await getMemberIdByNim(daily.member as number);
      const staffPromises = (daily.staff || []).map(async (staffNim) => {
        return await getMemberIdByNim(staffNim as number);
      });
      return {
        position: daily.position,
        member: memberId,
        staff: await Promise.all(staffPromises),
      };
    });

    const departmentPromises = body.department.map(async (department) => {
      const memberId = await getMemberIdByNim(department.coordinator as number);
      const memberPromises = department.members.map(async (member) => {
        return await getMemberIdByNim(member as number);
      });
      const staffPromises = (department.staff || []).map(async (staffNim) => {
        return await getMemberIdByNim(staffNim as number);
      });

      return {
        name: department.name,
        coordinator: memberId,
        members: await Promise.all(memberPromises),
        staff: await Promise.all(staffPromises),
      };
    });

    const [dailyManagement, department, considerationBoard, council] =
      await Promise.all([
        Promise.all(dailyManagementPromises),
        Promise.all(departmentPromises),
        Promise.all(considerationBoardPromises),
        Promise.all(councilPromises),
      ]);

    const updated = await OrganizerModel.findOneAndUpdate(
      {
        $expr: {
          $and: [
            { $gte: [{ $year: "$period.start" }, startYear] },
            { $lte: [{ $year: "$period.end" }, endYear] },
          ],
        },
      },
      {
        council,
        advisor,
        considerationBoard,
        dailyManagement,
        department,
        period: body.period,
      }
    );
    if (!updated) {
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal memperbarui data pengurus.",
      });
    }

    return {
      statusCode: 200,
      statusMessage: "Data pengurus berhasil diperbarui.",
    };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Terjadi kesalahan server.",
    };
  }
});

const getMemberIdByNim = async (NIM: number) => {
  const member = await MemberModel.findOne({ NIM });
  if (!member) {
    throw createError({
      statusCode: 404,
      statusMessage: `Anggota dengan NIM ${NIM} tidak ditemukan`,
    });
  }
  return member._id;
};
