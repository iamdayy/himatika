import { AgendaModel } from "~~/server/models/AgendaModel";
import { DocModel } from "~~/server/models/DocModel";
import { PhotoModel } from "~~/server/models/PhotoModel";
import { VideoModel } from "~~/server/models/VideoModel";

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    const { id } = event.context.params as { id: string };
    const roles: string[] = ["Public"];
    if (user) {
      roles.push("Member");
      if (event.context.organizer) {
        roles.push("Organizer");
      }
    }
    // Fetch a single agenda by ID
    const eventDataDoc = await AgendaModel.findById(id)
      .populate({
        path: "category",
        select: "_id title",
      })
      .populate({
        path: "photos",
        model: PhotoModel,
      })
      .populate({
        path: "videos",
        model: VideoModel,
      })
      .populate({
        path: "docs",
        match: {
          $or: [
            { signs: { $exists: false } }, // Kondisi 1: Array tidak ada (dianggap kosong)
            { signs: { $exists: true, $size: 0 } }, // Kondisi 2: Array ada, tapi kosong
            {
              signs: {
                $exists: true,
                $not: { $size: 0 }, // Array ada dan tidak kosong
                $elemMatch: { signed: true }, // Setidaknya satu elemen memiliki signed: true
              },
            },
          ],
        },
        model: DocModel,
      })
      .lean(); // Use lean to allow attaching properties

    if (!eventDataDoc) {
      throw createError({
        statusCode: 404,
        statusMessage: "Agenda not found",
      });
    }

    if (!roles.includes(eventDataDoc.configuration.canSee as string)) {
      throw createError({
        statusCode: 403,
        statusMessage: "You do not have permission to view this agenda",
      });
    }

    let participants: any[] = [];
    let committees: any[] = [];

    const { ParticipantModel } = await import("~~/server/models/ParticipantModel");
    const allParticipants = await ParticipantModel.find({ agendaId: id }).lean();

    // Permission to see participants
    if (roles.includes(eventDataDoc.configuration.canSeeRegistered as string) || roles.includes("Organizer")) {
      if (!event.context.organizer) {
        participants = allParticipants.map((p: any) => {
          if (p.member) {
            delete p.member.email;
            delete p.member.phone;
          }
          if (p.guest) {
            delete p.guest.email;
            delete p.guest.phone;
            delete p.guest.NIM;
          }
          return p;
        });
      } else {
        participants = allParticipants;
      }
    }
    
    const { CommitteeModel } = await import("~~/server/models/CommitteeModel");
    let fetchedCommittees = await CommitteeModel.find({ agendaId: id }).lean();

    // filter committee not approved if user is not committee or organizer
    const isMeCommitteeAndApproved = fetchedCommittees.some(
      (c: any) =>
        c.member?.NIM === user?.member?.NIM && c.approved
    );

    if (!event.context.organizer && !isMeCommitteeAndApproved) {
      committees = fetchedCommittees.filter(
        (member: any) =>
          member.approved ||
          member.member?.NIM === user?.member?.NIM
      ).map((c: any) => {
        if (c.member && c.member.NIM !== user?.member?.NIM) {
            delete c.member.email;
            delete c.member.phone;
        }
        return c;
      });
    } else {
      committees = fetchedCommittees;
    }

    let myParticipant = undefined;
    let myCommittee = undefined;

    if (user?.member) {
      const { MemberModel } = await import("~~/server/models/MemberModel");
      const member = await MemberModel.findOne({ NIM: user.member.NIM });
      if (member) {
        const { ParticipantModel } = await import("~~/server/models/ParticipantModel");
        myParticipant = await ParticipantModel.findOne({ agendaId: id, member: member._id }).lean();
        const { CommitteeModel } = await import("~~/server/models/CommitteeModel");
        myCommittee = await CommitteeModel.findOne({ agendaId: id, member: member._id }).lean();
      }
    } else if (user?.guest) {
      const { ParticipantModel } = await import("~~/server/models/ParticipantModel");
      myParticipant = await ParticipantModel.findOne({ agendaId: id, guest: user.guest._id }).lean();
    }

    // Inject 'sold' property and mask meetLink for non-organizers
    if (eventDataDoc.configuration?.participant?.ticketModels) {
      eventDataDoc.configuration.participant.ticketModels = eventDataDoc.configuration.participant.ticketModels.map(m => {
        const sold = allParticipants.filter((p: any) => p.ticketModelId === m._id?.toString() || p.ticketModelId === m.name).length;
        let mapped = { ...(m as any), sold };
        if (!event.context.organizer && mapped.meetLink) {
          mapped.meetLink = "true";
        }
        return mapped;
      });
    }

    const agenda = {
      ...eventDataDoc,
      participants,
      committees,
      participantsCount: participants.length,
      committeesCount: committees.length,
      myParticipant,
      myCommittee
    };

    return {
      statusCode: 200,
      statusMessage: "Agenda found",
      data: {
        agenda,
      },
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    });
  }
});
