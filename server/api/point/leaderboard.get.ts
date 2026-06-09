import { getTop5Leaderboard } from "~~/server/utils/leaderboard";
import { ILeaderboardResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<ILeaderboardResponse> => {
  const semester = event.context.user.member.semester;
  const nim = event.context.user.member.NIM;

  // Memanggil fungsi cache (akan mengeksekusi DB query hanya setiap 1 jam sekali per semester)
  const cachedData = await getTop5Leaderboard(semester);
  
  let leaderboard = [...cachedData.top5];
  
  // Cari posisi 'me' (user saat ini) dari fullRank yang di-cache
  const me = cachedData.fullRank.find((m) => m.nim == nim);

  // Jika 'me' tidak ada di dalam top 5, tambahkan 'me' ke posisi ke-5 atau terakhir
  if (me && !leaderboard.find((m) => m.nim == nim)) {
    leaderboard = leaderboard.slice(0, 4);
    leaderboard.push(me);
  }

  return {
    statusCode: 200,
    statusMessage: "Papan peringkat berhasil diambil (dari Cache)",
    data: {
        leaderboard,
        length: cachedData.fullRank.length,
    },
  };
});
