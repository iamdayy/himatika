import { Schema, Types, model } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { IPeriod } from "~/types";
import {
  IAdministratorMemberSchema,
  IAdministratorSchema,
} from "~/types/ISchemas";
import { ProfileModel } from "./ProfileModel";

export const PeriodSchema = new Schema<IPeriod>({
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
    required: true,
  },
});

export const AdministratorMemberSchema = new Schema<IAdministratorMemberSchema>(
  {
    role: {
      type: String,
      required: true,
    },
    profile: {
      type: Types.ObjectId,
      required: true,
      ref: "Profile",
      autopopulate: {
        model: ProfileModel,
        select:
          "NIM avatar email fullName class semester enteredYear createdAt",
      },
    },
  }
);

const AdministratorSchema = new Schema<IAdministratorSchema>({
  AdministratorMembers: {
    type: [AdministratorMemberSchema],
    required: true,
  },
  period: {
    type: PeriodSchema,
    required: true,
  },
});
AdministratorSchema.plugin(mongooseAutoPopulate);

export const AdministratorModel = model<IAdministratorSchema>(
  "Administrator",
  AdministratorSchema
);
