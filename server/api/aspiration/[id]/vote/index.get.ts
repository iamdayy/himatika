import { AspirationModel } from "~~/server/models/AspirationModel";
import { IMember } from "~~/types";
import type { IResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IResponse & { voteType?: string }> => {
    try {
      const AspirationId = event.context.params?.id;
      let voteType;

      const user = event.context.user;
      if (!user) {
        throw createError({
          statusCode: 401,
          statusMessage: "You must be logged in to use this endpoint",
        });
      }

      if (!AspirationId) {
        throw createError({
          statusCode: 400,
          statusMessage: "Aspiration ID is required",
        });
      }

      const Aspiration = await AspirationModel.findById(AspirationId);

      if (!Aspiration) {
        throw createError({
          statusCode: 404,
          statusMessage: "Aspiration not found",
        });
      }

      Aspiration.votes.forEach((vote) => {
        const exists = (vote.user as IMember).NIM === user.member.NIM;
        if (exists) {
          voteType = vote.voteType;
        }
      });

      return {
        statusCode: 200,
        statusMessage: "Vote recorded successfully",
        voteType,
      };
    } catch (error: any) {
      return {
        statusCode: 500,
        statusMessage: error.message,
      };
    }
  }
);
