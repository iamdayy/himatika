import bcrypt from "bcryptjs";
import mongoose, { Model, Schema, Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { IAgenda, IMember, IOrganizer, IUser } from "~~/types";
import { IUserSchema } from "~~/types/ISchemas";
import { AgendaModel } from "./AgendaModel";
import { AspirationModel } from "./AspirationModel";
import { DocModel } from "./DocModel";
import OrganizerModel from "./OrganizerModel";
import { ProjectModel } from "./ProjectModel";

/**
 * Interface for user methods
 */
interface IUserMethods {
  /**
   * Verifies the provided password against the stored hashed password
   * @param fromBody - The password to verify
   * @param fromDb - The hashed password stored in the database
   * @returns A promise that resolves to a boolean indicating whether the password is correct
   */
  verifyPassword: (fromBody: string, fromDb: string) => Promise<boolean>;
}

/**
 * Mongoose model type for User
 */
type IUserModel = Model<IUser, {}, IUserMethods>;

/**
 * Mongoose schema for User
 */
const userSchema = new Schema<IUserSchema, IUserModel, IUserMethods>(
  {
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
    verified: {
      type: Boolean,
      default: false,
    },
    member: {
      type: Types.ObjectId,
      ref: "Member",
      autopopulate: {
        match: {
          status: "active",
        },
        populate: [
          {
            path: "projects",
            model: ProjectModel,
          },
          {
            path: "agendasMember",
            model: AgendaModel,
            select: "title date at description configuration -_id",
            transform: (doc: IAgenda) => ({
              title: doc.title,
              date: doc.date,
              at: doc.at,
              description: doc.description,
              configuration: doc.configuration,
            }),
          },
          {
            path: "agendasCommittee",
            model: AgendaModel,
            select: "title date at description configuration -_id",
            transform: (doc: IAgenda) => ({
              title: doc.title,
              date: doc.date,
              at: doc.at,
              description: doc.description,
              configuration: doc.configuration,
            }),
          },
          {
            path: "aspirations",
            model: AspirationModel,
          },
          {
            path: "documents",
            model: DocModel,
          },
          {
            path: "organizersDepartmentCoordinator",
            model: OrganizerModel,
            transform: (doc: IOrganizer, id: any) => {
              if (doc) {
                return {
                  role: "Coordinator Department",
                  period: doc.period,
                };
              }
            },
          },
          {
            path: "docsRequestSign",
            model: DocModel,
          },
          {
            path: "organizersDailyManagement",
            model: OrganizerModel,
            transform: (doc: IOrganizer, id: any) => {
              if (doc) {
                return {
                  role: doc.dailyManagement.find(
                    (daily) => (daily.member as IMember).id == id
                  )?.position,
                  period: doc.period,
                };
              }
            },
          },
          {
            path: "organizersDepartmentMembers",
            model: OrganizerModel,
            transform: (doc: IOrganizer, id: any) => {
              if (doc) {
                return {
                  role: "Member Department",
                  period: doc.period,
                };
              }
            },
          },
        ],
      },
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save middleware to hash the user's password before saving
 */
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

/**
 * Method to verify the user's password
 */
userSchema.methods.verifyPassword = async (
  fromBody: string,
  fromDb: string
) => {
  try {
    const isMatch = await bcrypt.compare(fromBody, fromDb);
    return isMatch;
  } catch (error) {
    return false;
  }
};

// Apply the mongooseAutoPopulate plugin to the schema
userSchema.plugin(mongooseAutoPopulate);

/**
 * Mongoose model for User
 */
export const UserModel = mongoose.model("User", userSchema);
