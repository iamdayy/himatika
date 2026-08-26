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
        // Filter by the CALLER's member id. The old code fetched an arbitrary
        // (first) row per agenda, so everyone except the coincidental first
        // registrant got a 403.
        const { resolveMemberId } = await import("~~/server/utils/agendaAuth");
        const memberId = await resolveMemberId(user);
        if (memberId) {
          const committee = await CommitteeModel.findOne({
            agendaId: id,
            member: memberId,
          }).populate("member").exec();
          if (committee) {
            isRegisterd = committee;
            role = "committee";
          }

          if (!isRegisterd) {
            const participant = await ParticipantModel.findOne({
              agendaId: id,
              member: memberId,
            }).populate("member").exec();
            if (participant) {
              isRegisterd = participant;
              role = "participant";
            }
          }
        }
      }

      if (!isRegisterd && user?.guest) {
        const sessionGuestId =
          typeof user.guest === "string"
            ? user.guest
            : String((user.guest as any)?._id ?? "");
        if (sessionGuestId) {
          const participant = await ParticipantModel.findOne({
            agendaId: id,
            guest: sessionGuestId,
          }).populate("guest").exec();
          if (participant) {
            isRegisterd = participant;
            role = "participant";
          }
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
