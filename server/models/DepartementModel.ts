import mongoose, { Schema, Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { IDepartementSchema } from "~/types/ISchemas";
import { PeriodSchema } from "./AdministratorModel";
import { ProfileModel } from "./ProfileModel";

const departementSchema = new Schema<IDepartementSchema>({
  profile: {
    type: Types.ObjectId,
    required: true,
    ref: "Profile",
    autopopulate: {
      model: ProfileModel,
      select: "NIM email avatar fullName class semester createdAt",
    },
  },
  departement: {
    type: String,
    required: true,
  },
  period: {
    type: PeriodSchema,
    required: true,
  },
});
departementSchema.plugin(mongooseAutoPopulate);
export const DepartementModel = mongoose.model<IDepartementSchema>(
  "Departement",
  departementSchema
);
