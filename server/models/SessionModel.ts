import mongoose, { Schema, Types } from "mongoose";
import { ISessionSchema } from "~~/types/ISchemas";

/**
 * Schema definition for the Session model.
 */
const sessionSchema = new Schema<ISessionSchema>(
  {
    refreshToken: {
      type: String,
      required: false,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      index: true,
    },
    previousRefreshTokenHashes: {
      type: [String],
      required: false,
      default: undefined,
      index: true,
    },
    previousRefreshTokenExpiresAt: {
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

// TTL index sesuai durasi refresh token (90 hari)
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export const SessionModel = mongoose.models.Session || mongoose.model<ISessionSchema>(
  "Session",
  sessionSchema
);
