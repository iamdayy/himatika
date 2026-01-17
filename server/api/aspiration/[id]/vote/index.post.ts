import { AspirationModel } from "~~/server/models/AspirationModel";
import { MemberModel } from "~~/server/models/MemberModel";
import type { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
  try {
    const AspirationId = event.context.params?.id;
    const { voteType } = await readBody(event);

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

    if (!user || !voteType) {
      throw createError({
        statusCode: 400,
        statusMessage: "User ID and vote type are required",
      });
    }

    if (voteType !== "upvote" && voteType !== "downvote") {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid vote type",
      });
    }

    // 1. Check current state (Read)
    // We strictly need the user's current vote status to decide the action (Toggle vs Add)
    // Note: We use findOne with projection to fetch ONLY this user's vote for efficiency
    const currentAspiration = await AspirationModel.findOne(
        { _id: AspirationId },
        { votes: { $elemMatch: { user: user.member._id } } }
    );

    if (!currentAspiration) {
      throw createError({ statusCode: 404, statusMessage: "Aspiration not found" });
    }

    const existingVote = currentAspiration.votes?.[0]; // Mongoose $elemMatch returns array with 1 item if found

    // 2. Perform Atomic Write based on intent
    if (existingVote) {
       // SCENARIO: User HAS voted
       if (existingVote.voteType === voteType) {
         // SAME type -> REMOVE vote (Toggle Off)
         // Atomic Condition: User MUST match
         await AspirationModel.updateOne(
           { _id: AspirationId, "votes.user": user.member._id }, 
           { $pull: { votes: { user: user.member._id } } }
         );
       } else {
         // DIFFERENT type -> UPDATE vote (Change detected)
         // Atomic Condition: User MUST match
         await AspirationModel.updateOne(
            { _id: AspirationId, "votes.user": user.member._id },
            { $set: { "votes.$.voteType": voteType } }
         );
       }
    } else {
       // SCENARIO: User has NOT voted -> ADD vote
       // Atomic Condition: User MUST NOT be in array (Prevent Double Vote Race Condition)
       const memberId = await getMemberIdByNim(user.member.NIM); // Ensure proper ObjectId
       
       await AspirationModel.updateOne(
          { _id: AspirationId, "votes.user": { $ne: user.member._id } }, // Crucial Check
          { $push: { votes: { user: memberId, voteType } } }
       );
    }

    // No need to save(). updateOne is direct.
    return {
      statusCode: 200,
      statusMessage: "Vote recorded successfully",
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      statusMessage: error.message,
    };
  }
});

// Helper to get pure ObjectId for pushing (avoid large object if not needed)
const getMemberIdByNim = async (NIM: number) => {
    const member = await MemberModel.findOne({ NIM }).select("_id");
    return member?._id;
};
