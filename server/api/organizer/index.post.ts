import { put } from "@vercel/blob";
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

    const parts = await readMultipartFormData(event);
    if (!parts) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid form data",
      });
    }

    const dataPart = parts.find((part) => part.name === "organizerData");
    if (!dataPart || !dataPart.data) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing organizer data",
      });
    }

    const body = JSON.parse(dataPart.data.toString()) as IOrganizer;

    const councilPromises = body.council.map(async (council, index) => {
      const filePart = parts.find(
        (part) => part.name === `council-image-${index}`
      );
      let imageUrl = council.image; // Default to existing image path or null

      if (filePart && filePart.type?.startsWith("image/")) {
        const fileName = `${BASE_AVATAR_FOLDER}/${filePart.filename}.${
          filePart.type.split("/")[1]
        }`;
        const { url } = await put(fileName, filePart.data, {
          access: "public",
        });
        imageUrl = url;
      }
      return {
        position: council.position,
        name: council.name,
        image: imageUrl,
      };
    });

    const advisorFilePart = parts.find((part) => part.name === "advisor-image");
    let imageUrlAdvisor = body.advisor.image;
    if (advisorFilePart && advisorFilePart.type?.startsWith("image/")) {
      const fileName = `${BASE_AVATAR_FOLDER}/${advisorFilePart.filename}.${
        advisorFilePart.type.split("/")[1]
      }`;
      const { url } = await put(fileName, advisorFilePart.data, {
        access: "public",
      });
      imageUrlAdvisor = url;
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
  return member?._id || null;
};
