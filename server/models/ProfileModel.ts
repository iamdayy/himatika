import { defineMongooseModel } from "#nuxt/mongoose";
import { IAddressSchema, IProfileSchema } from "~/types/ISchemas";
import { Schema } from "mongoose";

const AddressSchema = new Schema<IAddressSchema>({
  fullAddress: String,
  village: String,
  district: String,
  city: String,
  province: String,
  country: String,
  zip: Number,
});

export const ProfileModel = defineMongooseModel<IProfileSchema>(
  "Profile",
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
    createdAt: {
      type: Date,
    },
    updatedAt: {
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
    },
  },
  (schema) => {
    schema.virtual("enteredAt").get(function (this: IProfileSchema) {
      return new Date(this.createdAt).getFullYear();
    });
    schema.virtual("projects", {
      ref: "Project",
      localField: "_id",
      foreignField: "registered.profile",
    });
    schema.virtual("events", {
      ref: "Event",
      localField: "_id",
      foreignField: "registered.profile",
    });
    schema.virtual("isAdministrator", {
      ref: "Administrator",
      localField: "_id",
      foreignField: "AdministratorMembers.profile",
      justOne: true,
    });
    schema.virtual("isDepartement", {
      ref: "Departement",
      localField: "_id",
      foreignField: "profile",
      justOne: true,
    });
  }
);
