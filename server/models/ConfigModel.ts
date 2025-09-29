import mongoose, { Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { ICarousel } from "~~/types";
import type { IConfigSchema } from "~~/types/ISchemas";
import { PhotoModel } from "./PhotoModel";
const carouselSchema = new mongoose.Schema<ICarousel>({
  title: { type: String },
  description: { type: String },
  date: { type: Date },
  image: {
    type: Types.ObjectId,
    ref: PhotoModel,
    autopopulate: true,
  },
});

const configSchema = new mongoose.Schema<IConfigSchema>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  address: { type: String, required: true },
  vision: { type: String, required: true },
  mission: { type: [String], required: true },
  contact: {
    type: {
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    required: true,
  },
  socialMedia: {
    type: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    required: true,
  },
  dailyManagements: { type: [String], required: true },
  departments: { type: [String], required: true },
  carousels: [carouselSchema],
  enscriptActivinessLetter: {
    type: Types.ObjectId,
  },
  minPoint: { type: Number },
});
configSchema.plugin(mongooseAutoPopulate);

// Add this middleware
configSchema.pre("save", async function (next) {
  const Config = this.constructor as typeof ConfigModel;
  const count = await Config.countDocuments();

  if (count >= 3) {
    const oldestConfig = await Config.findOne().sort({ _id: 1 });
    if (oldestConfig) {
      await oldestConfig.deleteOne();
    }
  }

  next();
});

export const ConfigModel = mongoose.model<IConfigSchema>(
  "Config",
  configSchema
);
