import mongoose, { Schema } from "mongoose";
import {
  IDailyManagementSchema,
  IDepartmentSchema,
  IOrganizerSchema,
} from "~~/types/ISchemas";

const DailyManagementSchema = new Schema<IDailyManagementSchema>({
  position: {
    type: String,
    required: true,
  },
  member: {
    type: Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },
});

const DepartmentSchema = new Schema<IDepartmentSchema>({
  name: {
    type: String,
    required: true,
  },
  coordinator: {
    type: Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
  ],
});

const OrganizerSchema = new Schema<IOrganizerSchema>({
  council: [
    {
      name: {
        type: String,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
      position: {
        type: String,
        required: true,
      },
    },
  ],
  advisor: {
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
  },
  considerationBoard: [
    {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
  ],
  dailyManagement: [DailyManagementSchema],
  department: [DepartmentSchema],
  period: {
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
  },
});

export default mongoose.model<IOrganizerSchema>("Organizer", OrganizerSchema);
