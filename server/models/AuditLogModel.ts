import mongoose, { Schema } from "mongoose";
import { IAuditLogSchema } from "~~/types/ISchemas";

const auditLogSchema = new Schema<IAuditLogSchema>(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.Mixed, // Can be ObjectId (Member), Number (NIM), or undefined (system/guest)
      ref: "Member",
    },
    ip: {
      type: String,
    },
    details: {
      type: Schema.Types.Mixed, // Flexible for different event structures
    },
    target: {
      type: String,
      index: true,
    },
  },
  { timestamps: true }
);

// TTL Index: Automatically expire logs after 1 year (31536000 seconds)
// Adjust as needed for compliance/storage
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

export const AuditLogModel = mongoose.model<IAuditLogSchema>(
  "AuditLog",
  auditLogSchema
);
