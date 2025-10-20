import { model, Schema } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { ISignSchema } from "~~/types/ISchemas";

export const SignSchema = new Schema<ISignSchema>(
  {
    encryption: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    signature: {
      type: String,
      required: true,
    },
    documentHash: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      autopopulate: "avatar NIM fullName email",
    },
  },
  {
    timestamps: true,
  }
);
SignSchema.plugin(mongooseAutoPopulate);

SignSchema.virtual("document", {
  ref: "Doc",
  localField: "_id",
  foreignField: "signs.sign",
  justOne: true,
});

export default model<ISignSchema>("Sign", SignSchema);
