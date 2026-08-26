import { PointModel } from "~~/server/models/PointModel";
import { ensureOrganizer } from "~~/server/utils/agendaAuth";
import { safeJsonParse } from "~~/server/utils/safeQuery";

const VALID_STATUSES = ["pending", "approved", "rejected"];

export default defineEventHandler(async (event) => {
  try {
    // Organizer-only: this queue contains member PII and the full point
    // history (previously reachable by any authenticated user).
    await ensureOrganizer(event.context.user);

    const query = getQuery(event);
    const status = safeJsonParse<string>(query.status, "") || String(query.status ?? "");
    const filter: Record<string, unknown> =
      VALID_STATUSES.includes(status) ? { status } : {};

    // Minimal field selection — never expose phone/address/birth here.
    const achievements = await PointModel.find(filter)
      .populate("member", "fullName NIM avatar semester")
      .populate("admin", "fullName NIM")
      .sort({ date: -1 })
      .limit(500)
      .lean();

    // Frontend (administrator/achievements) consumes a raw array.
    return achievements;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || "Internal Server Error",
    });
  }
});
