import bcrypt from "bcrypt";
import mongoose, { Schema, Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { IUserSchema } from "~/types/ISchemas";
const userSchema = new Schema<IUserSchema>({
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
      populate: [
        {
          path: "projects",
        },
        {
          path: "events",
        },
        {
          path: "isAdministrator",
        },
        {
          path: "isDepartement",
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
export const UserModel = mongoose.model<IUserSchema>("User", userSchema);
