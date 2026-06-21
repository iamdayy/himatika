import { BadgeModel } from "~~/server/models/BadgeModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { PointModel } from "~~/server/models/PointModel";
import { IBadge } from "~~/types";

export const getTop5Leaderboard = defineCachedFunction(async (semester: number) => {
  const { AgendaModel } = await import("~~/server/models/AgendaModel");
  
  // Ambil member aktif yang berada di semester yang sama (Cohort-based)
  const members = await MemberModel.find({ status: "active", semester: semester })
    .populate({
      path: "committeesData",
      populate: { path: "agendaId", model: AgendaModel }
    })
    .populate({
      path: "participantsData",
      populate: { path: "agendaId", model: AgendaModel }
    })
    .populate("projects")
    .populate("aspirations")
    .populate({path:"manualPoints", model:PointModel})
    .populate({path:"badges", model:BadgeModel});

  const leaderboard = members
    .map((member, index) => {
      const pointsData = member.point;
      let totalPoints = 0;

      const pointThisSemester = pointsData?.filter((p) => p.semester == semester);
      totalPoints = pointThisSemester?.reduce((sum, p) => sum + (p.point || 0), 0) || 0;

      return {
        _id: member._id,
        number: 0, // Akan diassign setelah sort
        fullName: member.fullName,
        avatar: member.avatar,
        nim: member.NIM,
        points: totalPoints,
        badges: member.badges as IBadge[],
      };
    })
    .filter(m => m.points > 0)
    .sort((a, b) => b.points - a.points);
  
  // Re-assign rank numbers
  leaderboard.forEach((m, i) => m.number = i + 1);

  return {
    top5: leaderboard.slice(0, 5),
    fullRank: leaderboard // We return full array so we can find 'me', but only cache the result once an hour per semester
  };
}, {
  maxAge: 60 * 60, // 1 hour cache
  name: "leaderboard-cache",
  getKey: (semester: number) => `leaderboard-sem-${semester}`
});
