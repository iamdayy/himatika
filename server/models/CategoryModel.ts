import { model, Schema } from "mongoose";
import { ICategorySchema } from "~~/types/ISchemas";

const CategorySchema = new Schema<ICategorySchema>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

CategorySchema.virtual("agendas", {
  ref: "Agenda",
  localField: "_id",
  foreignField: "category",
  justOne: false,
});

CategorySchema.virtual("projects", {
  ref: "Project",
  localField: "_id",
  foreignField: "category",
  justOne: false,
});

CategorySchema.virtual("news", {
  ref: "News",
  localField: "_id",
  foreignField: "category",
  justOne: false,
});

export default model<ICategorySchema>("Category", CategorySchema);
