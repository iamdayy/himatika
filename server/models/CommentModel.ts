import { Schema, Types, model } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { ICommentSchema } from "~~/types/ISchemas";

const CommentSchema = new Schema<ICommentSchema>(
  {
    body: { type: String, required: true },
    author: {
      type: Types.ObjectId,
      ref: "Member",
      autopopulate: {
        select: "fullName avatar",
      },
    },
    likes: {
      type: [
        {
          by: { type: String, default: "Guest", enum: ["Guest", "Member"] },
          member: {
            type: Types.ObjectId,
            ref: "Member",
            autopopulate: {
              select: "fullName avatar NIM",
            },
          },
          ip: {
            type: String || [String],
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

CommentSchema.plugin(mongooseAutoPopulate);

export const CommentModel = model<ICommentSchema>("Comment", CommentSchema);
