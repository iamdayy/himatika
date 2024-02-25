import { defineMongooseModel } from '#nuxt/mongoose';
import mongooseAutopopulate from "mongoose-autopopulate";
import { IUserSchema } from '~/types/ISchemas';
import { Types } from "mongoose";
import bcrypt from "bcrypt";
export const UserModel = defineMongooseModel<IUserSchema>("User", {
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
        type: String
    },
    profile: {
        type: Types.ObjectId,
        ref: "Profiles"
    }
},
{

},
 (schema) => {
    schema.plugin(mongooseAutopopulate),
    schema.pre('save', async function(next) {
        if (!this.isModified("password")) return next();
        try {
          const salt = await bcrypt.genSalt(10);
          this.password = await bcrypt.hash(this.password, salt);
          return next();
        } catch (error: any) {
          return next(error);
        }
      });
});