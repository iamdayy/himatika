import { DocModel } from "~~/server/models/DocModel";
import OrganizerModel from "~~/server/models/OrganizerModel";
import { PointModel } from "~~/server/models/PointModel";
import { IAgenda, IMember, IOrganizer, IProject } from "~~/types";
import type { IMeResponse } from "~~/types/IResponse";
import { UserModel } from "../../models/UserModel";
import { ensureAuth } from "../../utils/authHelper";

export default defineEventHandler(async (event): Promise<IMeResponse> => {
  // 1. Pastikan user login (Ringan, hanya cek token JWT & Lite Session)
  const sessionUser = await ensureAuth(event);

  if (!sessionUser.member || !sessionUser.member.NIM) {
    throw createError({
      statusCode: 404,
      statusMessage: "Member profile not found linked to this user.",
    });
  }

  // 2. Fetch Full Member Data (Heavy)
  // Gunakan NIM atau ID dari session untuk query ulang ke DB dengan Full Population
  // Karena UserModel memiliki default 'autopopulate' yang aktif, kita cukup findOne dengan user ID usernya
  // Namun, karena structure UserModel -> Member, kita cari usernya lagi agar dapat Member dengan virtuals-nya (points, agenda, etc)
  
  // Opsi A: Query Member langsung (tapi butuh ID member). Di session kita punya member object (poin 1).
  // Opsi B: Query User lalu ambil membernya (seperti cara lama tapi dedicated endpoint).
  
  // Kita pakai Opsi B agar konsisten dengan logic virtuals yang mungkin bergantung di User (konteks jarang, tapi aman).
  // ATAU lebih baik query MemberModel langsung jika ID member terekspos.
  // Di session lite (Sessions.ts), kita mengembalikan object member lean. 
  // Mongoose lean() object punya _id.
  
  // Cek apakah session.member punya _id?
  // Di Sessions.ts: select: "NIM fullName...". Default _id included.
  
  try {
    // Kita query UserModel full power (dengan autopopulate nyala sesuai default schema)
    const user = await UserModel.findOne({ username: sessionUser.username }, { autopopulate: {
      path: "member",
      select: "NIM avatar fullName email class semester enteredYear createdAt status",
      populate: [
        {
          path: "committeesData",
          populate: {
            path: "agendaId",
            select: "title date at description configuration committees -_id",
            transform: (doc: IAgenda) => ({
              title: doc.title,
              date: doc.date,
              at: doc.at,
              description: doc.description,
              configuration: doc.configuration,
            }),
          }
        },
        {
          path: "participantsData",
          populate: {
            path: "agendaId",
            select: "title date at description configuration participants -_id",
            transform: (doc: IAgenda) => ({
              title: doc.title,
              date: doc.date,
              at: doc.at,
              description: doc.description,
              configuration: doc.configuration,
            }),
          }
        },
        {
          path: "projects",
          select: "title deadline description -_id",
          transform: (doc: IProject) => ({
            title: doc.title,
            date: doc.date,
            description: doc.description,
          }),
        },
        {
          path: "organizersDailyManagement",
          model: OrganizerModel,
          transform: (doc: IOrganizer, id: any) => {
            if (doc) {
              return {
                role: doc.dailyManagement.find(
                  (daily) => (daily.member as IMember)?.id == id
                )?.position,
                period: doc.period,
              };
            }
            return null;
          },
        },
        {
          path: "organizersDepartmentCoordinator",
          model: OrganizerModel,
          transform: (doc: IOrganizer, id: any) => {
            if (doc) {
              return {
                role: "Coordinator Departement",
                period: doc.period,
              };
            }
            return null;
          },
        },
        {
          path: "organizersDepartmentMembers",
          model: OrganizerModel,
          transform: (doc: IOrganizer, id: any) => {
            if (doc) {
              return {
                role: "Member Departement",
                period: doc.period,
              };
            }
            return null;
          },
        },
        {
          path: "aspirations",
        },
        {
          path: "manualPoints",
          model: PointModel,
          select: "amount reason date status -_id",
          match: { status: "approved" },
        },
        {
          path: "documents",
          model: DocModel,
        },
      ]
    } });
    
    if (!user || !user.member) {
       throw createError({
        statusCode: 404,
        statusMessage: "Member details not found.",
      });
    }

    // Return hanya bagian member karena 'me' biasanya konteks profile anggota
    // User wrapper hanya untuk auth info (username, email, role di User level kalau ada)
    return {
        statusCode: 200,
        statusMessage: "Member details retrieved successfully.",
        data: {
            user: {
              ...user.toJSON().member,
              username: sessionUser.username
            },
        }
    };

  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to retrieve full profile.",
    });
  }
});
