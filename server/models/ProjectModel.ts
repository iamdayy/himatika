import mongoose, { Schema, Types } from "mongoose";
import {
  IContributorSchema,
  IProjectSchema,
  IRegisteredSchema,
} from "~/types/ISchemas";

const contributorSchema = new Schema<IContributorSchema>({
  profile: {
    type: Types.ObjectId,
    required: true,
    ref: "Profile",
    autopopulate: { select: "NIM avatar fullName class semester" },
  },
  job: {
    type: String,
    required: true,
  },
});

const registeredSchema = new Schema<IRegisteredSchema>({
  profile: {
    type: Types.ObjectId,
    required: true,
    ref: "Profile",
    autopopulate: { select: "NIM avatar fullName class semester" },
  },
  task: {
    type: String,
  },
});
const projectSchema = new Schema<IProjectSchema>(
  {
    title: {
      type: String,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    canSee: {
      type: String,
      default: "All",
      enum: ["Admin", "Departement", "Internal", "All", "External", "No"],
    },
    contributors: {
      type: [contributorSchema],
      default: [],
    },
    tasks: {
      type: Array<String>,
    },
    canRegister: {
      type: String,
      default: "No",
      enum: ["Admin", "Departement", "Internal", "All", "External", "No"],
    },
    registered: [registeredSchema],
    createdAt: Date,
    updatedAt: Date,
  },
  {
    timestamps: true,
  }
);
export const ProjectModel = mongoose.model<IProjectSchema>(
  "Project",
  projectSchema
);
