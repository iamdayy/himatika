import mongoose, { Schema, Types } from "mongoose";
import { ISessionSchema } from "~/types/ISchemas";
const sessionSchema = new Schema<ISessionSchema>(
  {
    accessToken: {
      type: String,
    },
    token: {
      type: String,
      required: true,
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
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });
export const SessionModel = mongoose.model<ISessionSchema>(
  "Session",
  sessionSchema
);
