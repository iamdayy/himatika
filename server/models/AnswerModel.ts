import { model, Schema, Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { IAnswerSchema } from "~~/types/ISchemas";
const AnswerSchema = new Schema<IAnswerSchema>({
  question: {
    type: Types.ObjectId,
    ref: "Question",
    required: true,
    autopopulate: {
      select:
        "question type options required max min acceptedFileTypes maxFileSize",
    },
  },
  value: {
    type: Schema.Types.Mixed,
    required: true,
  },
  answerer: {
    type: Types.ObjectId,
    // ref: "Member",
    required: true,
    // autopopulate: {
    //   select: "NIM fullName avatar email",
    // },
  },
});
AnswerSchema.plugin(mongooseAutoPopulate);

export const AnswerModel = model<IAnswerSchema>("Answer", AnswerSchema);
