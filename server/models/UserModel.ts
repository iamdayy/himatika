import bcrypt from "bcrypt";
import mongoose, { Model, Schema, Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { IUser } from "~/types";
import { IUserSchema } from "~/types/ISchemas";
import { AdministratorModel } from "./AdministratorModel";
import { DepartementModel } from "./DepartementModel";
import { EventModel } from "./EventModel";
import { ProfileModel } from "./ProfileModel";
import { ProjectModel } from "./ProjectModel";

interface IUserMethods {
  verifyPassword: (fromBody: string, fromDb: string) => Promise<boolean>;
}

type IUserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUserSchema, IUserModel, IUserMethods>({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  token: {
    type: String,
  },
  key: {
    type: String,
  },
  profile: {
    type: Types.ObjectId,
    ref: "Profile",
    autopopulate: {
      model: ProfileModel,
      populate: [
        {
          path: "projects",
          model: ProjectModel,
        },
        {
          path: "events",
          model: EventModel,
        },
        {
          path: "isAdministrator",
          model: AdministratorModel,
        },
        {
          path: "isDepartement",
          model: DepartementModel,
        },
      ],
    },
  },
});
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error: any) {
    return next(error);
  }
});
userSchema.methods.verifyPassword = async (
  fromBody: string,
  fromDb: string
) => {
  try {
    const isMatch = await bcrypt.compare(fromBody, fromDb);
    if (isMatch) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};
userSchema.plugin(mongooseAutoPopulate);
export const UserModel = mongoose.model("User", userSchema);
