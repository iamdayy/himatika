import { Schema, model } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { IMessageSchema } from "~~/types/ISchemas";

const messageSchema = new Schema<IMessageSchema>(
  {
    name: {
      type: {
        first: String,
        last: String,
      },
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    tags: {
      type: [String],
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
messageSchema.plugin(mongooseAutoPopulate);

export const MessageModel = model<IMessageSchema>("Message", messageSchema);
