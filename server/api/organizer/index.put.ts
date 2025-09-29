import fs from "fs";
import path from "path";
import { MemberModel } from "~~/server/models/MemberModel";
import OrganizerModel from "~~/server/models/OrganizerModel";
import { IFile, IOrganizer } from "~~/types";
import { IResponse } from "~~/types/IResponse";
const config = useRuntimeConfig();
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

    const chairmanText = [
      "ketua",
      "wakil ketua",
      "ketua umum",
      "chairman",
      "vice chairman",
    ];
    const isChairman = chairmanText.includes(
      event.context.organizer?.role.toLowerCase() || ""
    );
    if (!isChairman) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be chairman to use this endpoint",
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
        statusMessage: "Organizer not found",
      });
    }

    const body = await readBody<IOrganizer>(event);
    console.log(body);

    const councilPromises = body.council.map(async (council, i) => {
      const image = council.image as IFile;
      if (typeof image === "string") {
        return council;
      }
      if (image.type?.startsWith("image/")) {
        if (organizer.council[i].image) {
          const imagePath = path.join(
            config.storageDir,
            organizer.council[i].image as string
          );
          if (fs.existsSync(imagePath)) {
            deleteFile(organizer.council[i].image as string);
          }
        }
        const hashedName = await storeFileLocally(
          image,
          12,
          BASE_AVATAR_FOLDER
        );
        council.image = `${BASE_AVATAR_FOLDER}/${hashedName}`;
      }
      return {
        position: council.position,
        name: council.name,
        image: council.image,
      };
    });

    const advisorImage = body.advisor.image as IFile;
    let imageUrlAdvisor = "";
    if (advisorImage.type?.startsWith("image/")) {
      if (organizer.advisor.image) {
        const imagePath = path.join(
          config.storageDir,
          organizer.advisor.image as string
        );
        if (fs.existsSync(imagePath)) {
          deleteFile(organizer.advisor.image as string);
        }
      }
      const hashedName = await storeFileLocally(
        advisorImage,
        12,
        BASE_AVATAR_FOLDER
      );
      imageUrlAdvisor = `${BASE_AVATAR_FOLDER}/${hashedName}`;
    }
    const advisor = {
      position: body.advisor.position,
      name: body.advisor.name,
      image: imageUrlAdvisor,
    };
    if (typeof advisorImage === "string") {
      advisor.image == body.advisor.image;
    }

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
        statusMessage: "Failed to update organizer.",
      });
    }

    return {
      statusCode: 200,
      statusMessage: "Organizer update successfully.",
    };
  } catch (error: any) {
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
