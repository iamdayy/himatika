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
        ref: "Profile",
        autopopulate: true
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
      schema.methods.verifyPassword = async (fromBody: string, fromDb: string) => {
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
});