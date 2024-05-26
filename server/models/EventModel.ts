import mongoose, { Schema, Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import {
  ICommitteeSchema,
  IEventSchema,
  IRegisteredSchema,
} from "~/types/ISchemas";
import { ProfileModel } from "./ProfileModel";
const CommitteeSchema = new Schema<ICommitteeSchema>({
  job: {
    type: String,
    required: true,
  },
  user: {
    type: Types.ObjectId,
    required: true,
    ref: "Profile",
    autopopulate: {
      model: ProfileModel,
      select: "NIM avatar fullName class semester",
    },
  },
});

const registeredSchema = new Schema<IRegisteredSchema>({
  profile: {
    type: Types.ObjectId,
    required: true,
    ref: "Profile",
    autopopulate: {
      model: ProfileModel,
      select: "NIM avatar fullName class semester",
    },
  },
  task: {
    type: String,
  },
});
const eventSchema = new Schema<IEventSchema>(
  {
    title: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    at: {
      type: String,
      required: true,
    },
    canSee: {
      type: String,
      default: "All",
      enum: ["Admin", "Departement", "Internal", "All", "External", "No"],
    },
    description: {
      type: String,
    },
    committee: [CommitteeSchema],
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
eventSchema.plugin(mongooseAutoPopulate);
export const EventModel = mongoose.model<IEventSchema>("Event", eventSchema);
