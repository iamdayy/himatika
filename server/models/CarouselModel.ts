import mongoose, { Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import type { ICarousel } from "~~/types";
import { PhotoModel } from "./PhotoModel";

export interface ICarouselSchema extends Omit<ICarousel, '_id'>, mongoose.Document {}

const carouselSchema = new mongoose.Schema<ICarouselSchema>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  image: {
    type: Types.ObjectId,
    ref: PhotoModel,
    autopopulate: true,
  },
});

carouselSchema.plugin(mongooseAutoPopulate);

export const CarouselModel = mongoose.model<ICarouselSchema>(
  "Carousel",
  carouselSchema
);
