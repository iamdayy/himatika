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
    user: {
      type: Types.ObjectId,
      ref: "User",
      sparse: true,
    },
    guest: {
        type: Types.ObjectId,
        ref: "Guest",
        sparse: true,
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
