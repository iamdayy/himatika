import mongoose, { Schema, Types } from "mongoose";
import { ISessionSchema } from "~~/types/ISchemas";

/**
 * Schema definition for the Session model.
 */
const sessionSchema = new Schema<ISessionSchema>(
  {
    token: {
      type: String,
      index: true,
    },
    refreshToken: {
      type: String,
      required: true,
      index: true,
    },
    previousRefreshToken: {
      type: String,
      index: true,
    },
    previousToken: {
      type: String,
      index: true,
    },
    user: {
      type: Types.ObjectId,
      ref: "User",
    },
    createdAt: Date,
    updatedAt: Date,
  },
  {
    timestamps: true,
  }
);

// TTL index sesuai durasi refresh token (90 hari)
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export const SessionModel = mongoose.model<ISessionSchema>(
  "Session",
  sessionSchema
);
