import mongoose, { Schema, Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { IProjectSchema } from "~~/types/ISchemas";

/**
 * Schema for representing a project.
 */
const projectSchema = new Schema<IProjectSchema>(
  {
    /**
     * The title of the project.
     */
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    /**
     * A description of the project.
     */
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    category: {
      type: Types.ObjectId,
      required: true,
      ref: "Category",
      autopopulate: { select: "title description" },
    },
    url: {
      type: String,
      default: "",
    },
    members: {
      type: [Types.ObjectId],
      ref: "Member",
      autopopulate: { select: "fullName NIM email avatar" },
    },
    tags: {
      type: [String],
      required: true,
    },
    published: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
      getters: true,
    },
  }
);

// Enable auto-population for referenced documents
projectSchema.plugin(mongooseAutoPopulate);

projectSchema.virtual("photos", {
  ref: "Photo",
  localField: "_id",
  foreignField: "on",
  justOne: false,
});

/**
 * Mongoose model for the Project collection.
 */
export const ProjectModel = mongoose.model<IProjectSchema>(
  "Project",
  projectSchema
);
