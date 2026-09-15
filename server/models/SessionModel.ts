import mongoose, { Schema, Types } from "mongoose";
import { ISessionSchema } from "~~/types/ISchemas";

/**
 * Schema definition for the Session model.
 */
const sessionSchema = new Schema<ISessionSchema>(
  {
    refreshToken: {
      type: String,
      required: true,
      index: true,
    },
    previousRefreshToken: {
      type: String,
      required: false,
      index: true,
      sparse: true,
    },
    rotatedAt: {
      type: Date,
      required: false,
    },
    user: {
      type: Types.ObjectId,
      ref: "User",
      sparse: true,
      index: true,
    },
    guest: {
        type: Types.ObjectId,
        ref: "Guest",
        sparse: true,
        index: true,
    },
    createdAt: Date,
    updatedAt: Date,
  },
  {
    timestamps: true,
  }
);

// TTL follows last activity: every rotation touches updatedAt, so active
// users are not expired exactly 90 days after login.
sessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 7776000 });

export const SessionModel = mongoose.models.Session || mongoose.model<ISessionSchema>(
  "Session",
  sessionSchema
);
