import mongoose, { Schema } from "mongoose";
import { IGuestSchema } from "~~/types/ISchemas";

const guestSchema = new Schema<IGuestSchema>(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
    },
    instance: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    // Optional fields to match IGuest interface if needed
    NIM: Number,
    class: String,
    semester: Number,
    prodi: String,
  },
  {
    timestamps: true,
  }
);

export const GuestModel = mongoose.model<IGuestSchema>("Guest", guestSchema);
