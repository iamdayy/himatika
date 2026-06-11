import { AgendaModel } from "~~/server/models/AgendaModel";
import { IMember } from "~~/types";
import { IAgendaRegisteredResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IAgendaRegisteredResponse> => {
    try {
      const { id } = event.context.params as { id: string };
      const user = event.context.user;
      const agenda = await AgendaModel.findById(id);
      if (!agenda) {
        throw createError({
          statusCode: 404,
          statusMessage: "Agenda not found",
        });
      }

      const { ParticipantModel } = await import("~~/server/models/ParticipantModel");
      const { CommitteeModel } = await import("~~/server/models/CommitteeModel");

      let isRegisterd: any = false;
      let role = "";

      if (user?.member) {
        const committee = await CommitteeModel.findOne({ agendaId: id })
          .populate("member")
          .exec();
        
        // Populate member returns a full member document or object, we check NIM
        if (committee && (committee.member as any)?.NIM === user.member.NIM) {
          isRegisterd = committee;
          role = "committee";
        }

        if (!isRegisterd) {
          const participant = await ParticipantModel.findOne({ agendaId: id })
            .populate("member")
            .exec();
          if (participant && (participant.member as any)?.NIM === user.member.NIM) {
            isRegisterd = participant;
            role = "participant";
          }
        }
      }

      if (!isRegisterd && user?.guest) {
        const participant = await ParticipantModel.findOne({ agendaId: id })
          .populate("guest")
          .exec();
        if (participant && (participant.guest as any)?.email === user.guest.email) {
          isRegisterd = participant;
          role = "participant";
        }
      }

      if (!isRegisterd) {
        throw createError({
          statusCode: 403,
          statusMessage: "You are not registered for this agenda",
        });
      }
      return {
        statusCode: 200,
        statusMessage: "Successfully retrieved registration status",
        as: role as "committee" | "participant",
        data: isRegisterd,
      };
    } catch (error: any) {
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || "Internal Server Error",
      });
    }
  }
);
