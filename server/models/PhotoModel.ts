import { model, Schema, Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import type { IPhotoSchema } from "~~/types/ISchemas";

const photoSchema = new Schema<IPhotoSchema>({
  image: { type: String, required: true },
  tags: { type: [String], required: true },
  uploader: {
    type: Schema.Types.ObjectId,
    ref: "Member",
    required: true,
    autopopulate: {
      select: "fullName NIM",
    },
  },
  archived: { type: Boolean, default: false },
  archivedAt: { type: Date, default: null },
  on: {
    type: Types.ObjectId,
    required: false,
    refPath: "onModel",
  },
  onModel: {
    type: String,
    enum: ["Project", "Agenda", "Aspiration"],
    required: false,
  },
});

photoSchema.index({ title: "text", description: "text", tags: "text" });
photoSchema.plugin(mongooseAutoPopulate);

export const PhotoModel = model<IPhotoSchema>("Photo", photoSchema);
