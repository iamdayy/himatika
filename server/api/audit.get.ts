import { AuditLogModel } from "~~/server/models/AuditLogModel";

export default defineEventHandler(async (event) => {
  // Ensure user is admin or organizer (add your role check logic here)
  if (!event.context.user) {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  // Basic pagination
  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const logs = await AuditLogModel.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("user", "fullName NIM email"); // Populate user details

  const total = await AuditLogModel.countDocuments();

  return {
    statusCode: 200,
    data: logs,
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
});
