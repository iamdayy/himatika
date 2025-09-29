import { model, Schema } from "mongoose";
import { IOptionSchema, IQuestionSchema } from "~~/types/ISchemas";

const OptionSchema = new Schema<IOptionSchema>({
  value: {
    type: String,
    default: "",
  },
});

const QuestionSchema = new Schema<IQuestionSchema>({
  question: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  options: {
    type: [OptionSchema],
  },
  max: {
    type: Number,
  },
  min: {
    type: Number,
  },
  acceptedFileTypes: {
    type: [String],
  },
  maxFileSize: {
    type: Number,
    default: 1, // 10MB
  },
  required: {
    type: Boolean,
    default: false,
  },
});

export const QuestionModel = model<IQuestionSchema>("Question", QuestionSchema);
