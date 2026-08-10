import mongoose, { model, Schema, Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { IParticipantSchema } from "~~/types/ISchemas";
import { AnswerModel } from "./AnswerModel";
import { paymentSchema } from "./AgendaModel";

/**
 * Schema for representing a participant for an agenda event.
 */
const participantSchema = new Schema<IParticipantSchema>(
  {
    agendaId: {
      type: Types.ObjectId,
      ref: "Agenda",
      required: true,
      index: true,
    },
    member: {
      type: Types.ObjectId,
      ref: "Member",
      autopopulate: {
        select: "NIM avatar fullName email class semester createdAt",
      },
      index: true,
    },
    guest: {
      type: Types.ObjectId,
      ref: "Guest",
      autopopulate: true,
    },
    visiting: {
      type: Boolean,
      default: false,
    },
    visitAt: {
      type: String,
    },
    visitTime: {
      type: Date,
    },
    payment: {
      type: paymentSchema,
      default: () => ({
        method: "cash",
        status: "pending",
      }),
    },
    certificateDoc: {
      type: Types.ObjectId,
      ref: "Doc",
    },
    ticketModelId: {
      type: String,
    },
  },
  { timestamps: true }
);

participantSchema.index(
  { agendaId: 1, member: 1 },
  {
    unique: true,
    partialFilterExpression: { member: { $exists: true, $type: "objectId" } }
  }
);
participantSchema.index(
  { agendaId: 1, guest: 1 },
  {
    unique: true,
    partialFilterExpression: { guest: { $exists: true, $type: "objectId" } }
  }
);

participantSchema.virtual("answers", {
  ref: AnswerModel,
  localField: "_id",
  foreignField: "answerer",
  justOne: false,
});

participantSchema.plugin(mongooseAutoPopulate);

/**
 * Mongoose model for the Participant collection.
 */
export const ParticipantModel = mongoose.models.Participant || model<IParticipantSchema>(
  "Participant",
  participantSchema
);
