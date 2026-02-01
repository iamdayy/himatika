import { BadgeModel } from "~~/server/models/BadgeModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { PointModel } from "~~/server/models/PointModel";
import { IBadge } from "~~/types";
import { ILeaderboardResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<ILeaderboardResponse> => {
  // Fetch active members
  // We need to populate all fields required for point calculation
  // Warning: This is resource intensive. For optimization, points should be cached in DB.
  const members = await MemberModel.find({ status: "active" })
    .populate("agendasCommittee")
    .populate("agendasMember")
    .populate("projects")
    .populate("aspirations")
    .populate({path:"manualPoints", model:PointModel})
    .populate({path:"badges", model:BadgeModel});

  let leaderboard = members
    .map((member) => {
      const pointsData = member.point;
      let totalPoints = 0;

      if (Array.isArray(pointsData)) {
        totalPoints = pointsData.reduce((sum, p) => sum + (p.point || 0), 0);
      }

      return {
        _id: member._id,
        fullName: member.fullName,
        avatar: member.avatar,
        nim: member.NIM,
        points: totalPoints,
        badges: member.badges as IBadge[],
      };
    })
    .filter(m => m.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

    const meRaw = members.find(
      (member) => member.NIM == event.context.user.member.NIM
    );
    let me;
    if (meRaw) {
      let totalPoints = 0;
      if (Array.isArray(meRaw.point)) {
        totalPoints = meRaw.point.reduce((sum, p) => sum + (p.point || 0), 0);
      }
        me = {
        _id: meRaw._id,
        fullName: meRaw.fullName,
        avatar: meRaw.avatar,
        nim: meRaw.NIM,
        points: totalPoints,
        badges: meRaw.badges as IBadge[],
    };
    }

    if (me && !leaderboard.includes(me)) {
      leaderboard = leaderboard.slice(0, 4);
      leaderboard.push(me);
    }

  return {
    statusCode: 200,
    statusMessage: "Papan peringkat berhasil diambil",
    data: {
        leaderboard,
        length: members.length,
    },
  };
});
