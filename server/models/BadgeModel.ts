import mongoose, { Schema } from "mongoose";
import { IBadgeSchema } from "~~/types/ISchemas";

const badgeSchema = new Schema<IBadgeSchema>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    minPoints: {
      type: Number,
      required: false,
    },
  },
  { timestamps: true }
);

export const BadgeModel = mongoose.model<IBadgeSchema>("Badge", badgeSchema);
