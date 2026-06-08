import mongoose, { model, Schema, Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { ICommitteeSchema } from "~~/types/ISchemas";
import { AnswerModel } from "./AnswerModel";
import { paymentSchema } from "./AgendaModel";

/**
 * Schema for representing a committee member for an agenda event.
 */
const committeeSchema = new Schema<ICommitteeSchema>(
  {
    agendaId: {
      type: Types.ObjectId,
      ref: "Agenda",
      required: true,
      index: true,
    },
    job: {
      type: String,
      required: true,
    },
    member: {
      type: Types.ObjectId,
      ref: "Member",
      autopopulate: {
        select: "NIM avatar fullName email class semester createdAt",
      },
      index: true,
    },
    approved: {
      type: Boolean,
      default: false,
    },
    approvedAt: {
      type: Date,
    },
    visitAt: {
      type: String,
    },
    visitTime: {
      type: Date,
    },
    visiting: {
      type: Boolean,
      default: false,
    },
    payment: {
      type: paymentSchema,
      default: {
        method: "cash",
        status: "pending",
        time: Date.now(),
      },
    },
    certificateDoc: {
      type: Types.ObjectId,
      ref: "Doc",
    },
  },
  { timestamps: true }
);

committeeSchema.virtual("answers", {
  ref: AnswerModel,
  localField: "_id",
  foreignField: "answerer",
  justOne: false,
});

committeeSchema.plugin(mongooseAutoPopulate);

/**
 * Mongoose model for the Committee collection.
 */
export const CommitteeModel = model<ICommitteeSchema>(
  "Committee",
  committeeSchema
);
