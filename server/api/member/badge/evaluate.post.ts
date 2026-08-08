import { BadgeModel } from "~~/server/models/BadgeModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { PointModel } from "~~/server/models/PointModel";

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user || !user.member) {
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const memberId = user.member._id;

    // Hitung total point
    const points = await PointModel.find({ member: memberId, status: "approved" });
    const totalPoints = points.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Dapatkan badge yang eligible
    const eligibleBadges = await BadgeModel.find({ minPoints: { $lte: totalPoints, $gt: 0 } });
    const eligibleBadgeIds = eligibleBadges.map(b => b._id);

    // Update member
    const member = await MemberModel.findById(memberId);
    if (!member) {
      throw createError({ statusCode: 404, statusMessage: "Member not found" });
    }

    // Merge array to avoid duplicates
    const currentBadges = member.badges ? member.badges.map(b => b.toString()) : [];
    let newBadgesAdded = false;

    for (const id of eligibleBadgeIds) {
      if (!currentBadges.includes(id.toString())) {
        currentBadges.push(id.toString());
        newBadgesAdded = true;
      }
    }

    if (newBadgesAdded) {
      member.badges = currentBadges as any;
      await member.save();
    }

    return {
      statusCode: 200,
      statusMessage: "Badges evaluated successfully",
      data: {
        totalPoints,
        badges: currentBadges,
        newBadgesAdded
      }
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    });
  }
});
