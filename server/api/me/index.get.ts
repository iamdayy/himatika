import { MemberModel } from "~~/server/models/MemberModel";
import { IMeResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IMeResponse> => {
  const userLite = event.context.user; // Ini user dari checkSession
  if (!userLite) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  try {
    // Kita panggil ulang dari DB untuk dapat data LENGKAP (Full Graph)
    // TAPI hanya dipanggil saat user membuka halaman profil, bukan setiap request.
    const memberFull = await MemberModel.findById(userLite.member._id)
      .populate({ path: "projects", select: "title date description -_id" })
      .populate({
        path: "agendasCommittee",
        select: "title date at description configuration -_id",
      })
      .populate({
        path: "agendasMember",
        select: "title date at description configuration -_id",
      })
      .populate({
        path: "aspirations",
        select: "subject message votes",
      })
      .populate("manualPoints")
      .populate("documents")
      .populate("docsRequestSign")
      .populate({
        path: "organizersConsiderationBoard",
        select: "period",
      })
      .populate({
        path: "organizersDepartmentCoordinator",
        select: "period",
      })
      .populate({
        path: "organizersDailyManagement",
        select: "period position",
      })
      .populate({
        path: "organizersDepartmentMembers",
        select: "period",
      });

    return {
      statusCode: 200,
      statusMessage: "Member fetched successfully.",
      data: {
        me: {
          ...userLite,
          member: memberFull,
        },
      },
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Internal server error.",
    });
  }
});
