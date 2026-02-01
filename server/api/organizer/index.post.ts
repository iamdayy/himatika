import { PutObjectCommand } from "@aws-sdk/client-s3";
import { MemberModel } from "~~/server/models/MemberModel";
import OrganizerModel from "~~/server/models/OrganizerModel";
import { IMember, IOrganizer } from "~~/types";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const BASE_AVATAR_FOLDER = "/uploads/img/avatar";
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "You must be logged in to use this endpoint",
      });
    }
    if (!event.context.organizer) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be admin / departement to use this endpoint",
      });
    }
    const org = user.member as IMember;
    if (!org) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be member to use this endpoint",
      });
    }
    const chairmanText = [
      "ketua",
      "wakil ketua",
      "ketua umum",
      "chairman",
      "vice chairman",
    ];
    const isChairman = chairmanText.includes(
      org.organizer?.role.toLowerCase() || ""
    );

    if (!isChairman) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be chairman to use this endpoint",
      });
    }
    const isOneMonthToEndPeriod =
      new Date(event.context.organizer.period.end).getTime() -
        1000 * 60 * 60 * 24 * 30 <=
      Date.now();

    if (!isOneMonthToEndPeriod) {
      throw createError({
        statusCode: 403,
        statusMessage:
          "You must be one month to end period to use this endpoint",
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

    // Ensure organizerData is a string before parsing
    const organizerDataStr =
      typeof uploadedData.organizerData === "string"
        ? uploadedData.organizerData
        : uploadedData.organizerData.data.toString();

    const body = JSON.parse(organizerDataStr) as IOrganizer;

    const councilPromises = body.council.map(async (council, index) => {
      const filePart = uploadedData[`council-image-${index}`];
      let imageUrl = council.image; // Default to existing image path or null

      if (filePart && typeof filePart !== "string") {
        const fileExtension = filePart.type?.split("/")[1] || "jpg";
        const fileName = `${BASE_AVATAR_FOLDER}/${
          filePart.name || `council-${index}`
        }.${fileExtension}`;

        await r2Client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: fileName,
            Body: filePart.data,
            ContentType: filePart.type,
          })
        );
        imageUrl = `${R2_PUBLIC_DOMAIN}/${fileName}`;
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
      const fileExtension = advisorFilePart.type?.split("/")[1] || "jpg";
      const fileName = `${BASE_AVATAR_FOLDER}/${
        advisorFilePart.name || "advisor"
      }.${fileExtension}`;
      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: fileName,
          Body: advisorFilePart.data,
          ContentType: advisorFilePart.type,
        })
      );
      imageUrlAdvisor = `${R2_PUBLIC_DOMAIN}/${fileName}`;
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
      return {
        position: daily.position,
        member: memberId,
      };
    });

    const departmentPromises = body.department.map(async (department) => {
      const memberId = await getMemberIdByNim(department.coordinator as number);
      const memberPromises = department.members.map(async (member) => {
        return await getMemberIdByNim(member as number);
      });

      return {
        name: department.name,
        coordinator: memberId,
        members: await Promise.all(memberPromises),
      };
    });

    const [dailyManagement, department, considerationBoard, council] =
      await Promise.all([
        Promise.all(dailyManagementPromises),
        Promise.all(departmentPromises),
        Promise.all(considerationBoardPromises),
        Promise.all(councilPromises),
      ]);
    const organizer = await OrganizerModel.create({
      council,
      advisor,
      considerationBoard,
      dailyManagement,
      department,
      period: body.period,
    });
    if (!organizer) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to create organizer.",
      });
    }

    return {
      statusCode: 200,
      statusMessage: "Organizer created successfully.",
    };
  } catch (error: any) {
    console.error(error);
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Internal server error.",
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
