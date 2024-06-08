import mongoose, { Schema } from "mongoose";
import { IAddressSchema, IProfileSchema } from "~/types/ISchemas";
const AddressSchema = new Schema<IAddressSchema>({
  fullAddress: String,
  village: String,
  district: String,
  city: String,
  province: String,
  country: String,
  zip: Number,
});

const profileSchema = new Schema<IProfileSchema>(
  {
    NIM: {
      type: Number,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
    class: {
      type: String,
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    birth: {
      type: {
        place: String,
        date: Date,
      },
      required: true,
    },
    sex: {
      type: String,
      required: true,
      enum: ["female", "male"],
    },
    religion: {
      type: String,
      required: true,
    },
    citizen: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: AddressSchema,
    },
    isRegistered: {
      type: Boolean,
      required: true,
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

profileSchema.virtual("enteredYear").get(function (this: IProfileSchema) {
  return new Date(this.createdAt).getFullYear();
});
profileSchema.virtual("projects", {
  ref: "Project",
  localField: "_id",
  foreignField: "registered.profile",
});
profileSchema.virtual("events", {
  ref: "Event",
  localField: "_id",
  foreignField: "registered.profile",
});
profileSchema.virtual("isAdministrator", {
  ref: "Administrator",
  localField: "_id",
  foreignField: "AdministratorMembers.profile",
  justOne: true,
  match: {
    "period.end": { $gte: new Date(Date.now()) },
  },
});
profileSchema.virtual("isDepartement", {
  ref: "Departement",
  localField: "_id",
  foreignField: "profile",
  justOne: true,
  match: {
    "period.end": { $gte: new Date(Date.now()) },
  },
});

profileSchema.index({ NIM: "text", fullName: "text", email: "text" });
export const ProfileModel = mongoose.model<IProfileSchema>(
  "Profile",
  profileSchema
);
