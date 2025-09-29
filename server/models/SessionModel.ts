import mongoose, { Schema, Types } from "mongoose";
import { ISessionSchema } from "~~/types/ISchemas";

/**
 * Schema definition for the Session model.
 */
const sessionSchema = new Schema<ISessionSchema>(
  {
    /**
     * The authentication token for the session.
     */
    token: {
      type: String,
    },
    /**
     * The refresh token for the session. Required for token renewal.
     */
    refreshToken: {
      type: String,
      required: true,
    },
    /**
     * Reference to the User associated with this session.
     */
    user: {
      type: Types.ObjectId,
      ref: "User",
    },
    /**
     * The date and time when the session was created.
     */
    createdAt: Date,
    /**
     * The date and time when the session was last updated.
     */
    updatedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index to automatically expire sessions after 7 days (604800 seconds)
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

/**
 * Mongoose model for the Session collection.
 */
export const SessionModel = mongoose.model<ISessionSchema>(
  "Session",
  sessionSchema
);
