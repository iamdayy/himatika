import { model, Schema, Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import type { IVideoSchema } from "~~/types/ISchemas";

const videoSchema = new Schema<IVideoSchema>({
  video: { type: String, required: true },
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

videoSchema.index({ title: "text", description: "text", tags: "text" });
videoSchema.plugin(mongooseAutoPopulate);

export const VideoModel = model<IVideoSchema>("Video", videoSchema);
