import mongoose, { Schema } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
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
    autopopulate: {
      // model: MemberModel,
      select: "NIM avatar fullName email class semester createdAt",
    },
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
    autopopulate: {
      // model: MemberModel,
      select: "NIM avatar fullName email class semester createdAt",
    },
  },
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      autopopulate: {
        // model: MemberModel,
        select: "NIM avatar fullName email class semester createdAt",
      },
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
      autopopulate: {
        // model: MemberModel,
        select: "NIM avatar fullName email class semester createdAt",
      },
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

OrganizerSchema.plugin(mongooseAutoPopulate);

export default mongoose.model<IOrganizerSchema>("Organizer", OrganizerSchema);
