import { AuditLogModel } from "~~/server/models/AuditLogModel";

interface LogOptions {
  action: string;
  event: any; // H3Event
  details?: any;
  target?: string;
}

export const logAction = async (options: LogOptions) => {
  try {
    const { action, event, details, target } = options;
    const user = event.context.user?.member?._id || event.context.user?._id;
    
    // Get IP securely (handle proxies if needed)
    const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown';

    await AuditLogModel.create({
      action,
      user,
      ip,
      details,
      target,
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw error to avoid blocking the main request
  }
};
