import mongoose, { model, Schema, Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { ICommittee, IGuest, IMember, IParticipant, IUser } from "~~/types";
import {
  IAgendaConfigurationSchema,
  IAgendaSchema,
  ICertificateConfigurationSchema,
  ICommitteeConfigurationSchema,
  ICommitteeSchema,
  IGuestSchema,
  IJobSchema,
  IParticipantConfigurationSchema,
  IParticipantSchema,
  IPaymentSchema,
  IReqruitmentSchema,
} from "~~/types/ISchemas";
import { AnswerModel } from "./AnswerModel";
import CategoryModel from "./CategoryModel";
import { QuestionModel } from "./QuestionModel";
interface IAgendaMethods {
  canMeRegisterAsParticipant(user?: IUser): boolean;
  canMeRegisterAsCommittee(user?: IUser): boolean;
  isRegisterd(user?: IUser): ICommittee | IParticipant | false;
  isRegisterdById(registeredId: string): ICommittee | IParticipant | false;
}
type IAgendaModel = mongoose.Model<IAgendaSchema, {}, IAgendaMethods>;

const IGuestSchema = new Schema<IGuestSchema>({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    index: true, 
    sparse: true,
  },
  phone: {
    type: String,
    required: true,
  },
  NIM: {
    type: Number,
    sparse: true,
  },
  semester: {
    type: Number,
  },
  class: {
    type: String,
  },
  prodi: {
    type: String,
  },
  instance: {
    type: String,
  },
});

export const paymentSchema = new Schema<IPaymentSchema>({
  method: {
    type: String,
    enum: ["cash", "bank_transfer", "qris", "manual_transfer"],
    required: true,
    default: "cash",
  },
  status: {
    type: String,
    default: "pending",
    enum: ["pending", "verifying", "canceled", "success", "expired", "failed"],
  },
  manual_target: {
    type: String,
  },
  proof_url: {
    type: String,
  },
  order_id: {
    type: String,
  },
  transaction_id: {
    type: String,
  },
  time: {
    type: Date,
    default: Date.now,
  },
  expiry: {
    type: Date,
  },
  bank: {
    type: String,
  },
  va_number: {
    type: String,
  },
  qris_png: {
    type: String,
  },
});

const reqruitmentSchema = new Schema<IReqruitmentSchema>({
  label: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

const jobSchema = new Schema<IJobSchema>({
  label: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    default: 1,
  },
});

const ticketModelSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  quota: {
    type: Number,
  },
  meetLink: {
    type: String,
  },
});

/**
 * Schema for representing a committee configuration.
 */
const committeeConfigurationSchema = new Schema<ICommitteeConfigurationSchema>({
  pay: {
    type: Boolean,
    default: false,
  },
  amount: {
    type: Number,
    default: 0,
  },
  point: {
    type: Number,
    default: 0,
  },
  reqruitments: {
    type: [reqruitmentSchema],
    default: [],
  },
  jobAvailables: {
    type: [jobSchema],
    default: [],
  },
  canRegister: {
    type: String,
    enum: ["Public", "Organizer", "Member", "None"],
    default: "None",
  },
  canRegisterUntil: {
    type: new Schema(
      {
        start: { type: Date, required: true },
        end: { type: Date, required: true },
      },
      { _id: false }
    ),
  },
  questions: {
    type: [Types.ObjectId],
    ref: QuestionModel,
    autopopulate: {
      select:
        "question type options required max min acceptedFileTypes maxFileSize",
    },
  },
  ticketModels: {
    type: [ticketModelSchema],
    default: [],
  },
});
/**
 * Schema for representing a participant configuration.
 */

const participantConfigurationSchema =
  new Schema<IParticipantConfigurationSchema>({
    pay: {
      type: Boolean,
      default: false,
    },
    amount: {
      type: Number,
      default: 0,
    },
    point: {
      type: Number,
      default: 0,
    },
    reqruitments: {
      type: [reqruitmentSchema],
      default: [],
    },
    canRegister: {
      type: String,
      enum: ["Public", "Organizer", "Member", "None"],
      default: "Public",
    },
    canRegisterUntil: {
      type: new Schema(
        {
          start: { type: Date, required: true },
          end: { type: Date, required: true },
        },
        { _id: false }
      ),
    },
    questions: {
      type: [Types.ObjectId],
      ref: QuestionModel,
      autopopulate: {
        select:
          "question type options required max min acceptedFileTypes maxFileSize",
      },
    },
    ticketModels: {
      type: [ticketModelSchema],
      default: [],
    },
  });

const certificateItemSchema = new Schema({
  id: { type: String }, // stable cross-reference id
  type: {
    type: String,
    required: true,
    enum: ["name", "role", "text", "signature", "qr", "date", "code"],
  },
  label: String,
  value: String,
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: Number,
  height: Number,
  fontSize: Number,
  fontWeight: String,
  fontFamily: String,
  align: { type: String, default: "center", enum: ["left", "center", "right"] },
  color: { type: String, default: "#000000" },
  // Signature-specific fields
  signerType: { type: String, enum: ['external', 'system'], default: 'external' },
  signerNIM: { type: String },   // NIM member sistem (system mode)
  signerName: { type: String },  // Nama cetak signer eksternal
  signerAs: { type: String },    // Jabatan penandatangan
});

const certificateConfigurationSchema =
  new Schema<ICertificateConfigurationSchema>({
    active: { type: Boolean, default: false },
    templateUrl: String,
    previewUrl: String,
    pdfWidth: Number,
    pdfHeight: Number,
    items: [certificateItemSchema],
    signers: [
      new Schema(
        {
          memberId: { type: Types.ObjectId, ref: 'Member', required: true },
          as: { type: String, required: true },
          signatureItemId: { type: String }, // references ICertificateItem.id
        },
        { _id: false }
      ),
    ],
  });

const sponsorSchema = new Schema({
  name: { type: String, required: true },
  logo: { type: String, required: true },
  url: { type: String },
  showOnPdf: { type: Boolean, default: false }
});

const manualPaymentTargetSchema = new Schema({
  name: { type: String, required: true },
  account: { type: String, required: true },
  owner: { type: String, required: true },
  instructions: { type: String },
});

/**
 * Schema for representing an agenda configuration.
 */
const configurationSchema = new Schema<IAgendaConfigurationSchema>({
  committee: {
    type: committeeConfigurationSchema,
    default: {},
  },
  participant: {
    type: participantConfigurationSchema,
    default: {},
  },
  certificate: {
    type: certificateConfigurationSchema,
    default: {},
  },
  canSee: {
    type: String,
    enum: ["Public", "Organizer", "Member"],
    default: "Public",
  },
  onlyParticipantCanVisit: {
    type: Boolean,
    default: false,
  },
  messageAfterRegister: {
    type: String,
    default: "You have successfully registered for this event.",
  },
  canSeeRegistered: {
    type: String,
    enum: ["Public", "Organizer", "Member"],
    default: "Public",
  },
  sponsors: {
    type: [sponsorSchema],
    default: [],
  },
  manualPayments: {
    type: [manualPaymentTargetSchema],
    default: [],
  },
});
/**
 * Schema for representing a committee member.
 */
const CommitteeSchema = new Schema<ICommitteeSchema>({
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
    ref: 'Doc',
  },
  // answers: {
  //   type: [AnswerSchema],
  // },
});
CommitteeSchema.virtual("answers", {
  ref: AnswerModel,
  localField: "_id",
  foreignField: "answerer",
  justOne: false,
});

/**
 * Schema for representing a participant participant.
 */
const participantSchema = new Schema<IParticipantSchema>({
  member: {
    type: Types.ObjectId,
    ref: "Member",
    autopopulate: {
      select: "NIM avatar fullName email class semester createdAt",
    },
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
    default: {
      method: "cash",
      status: "pending",
      time: Date.now(),
    },
  },
  certificateDoc: {
    type: Types.ObjectId,
    ref: 'Doc',
  },
});

participantSchema.virtual("answers", {
  ref: AnswerModel,
  localField: "_id",
  foreignField: "answerer",
  justOne: false,
});

/**
 * Schema for representing an configuration committee.
 */

/**
 * Schema for representing an event.
 */
const agendaSchema = new Schema<IAgendaSchema, IAgendaModel, IAgendaMethods>(
  {
    title: {
      type: String,
      required: true,
    },
    date: {
      type: {
        start: Date,
        end: Date,
      },
      required: true,
    },
    category: {
      type: Types.ObjectId,
      required: true,
      ref: CategoryModel,
      autopopulate: { select: "title description" },
    },
    tags: {
      type: [String],
      default: [],
    },
    at: {
      type: String,
      required: true,
    },
    atLink: {
      type: String,
    },
    description: {
      type: String,
    },
    configuration: {
      type: configurationSchema,
      default: {},
    },
    certificates: {
      type: [Types.ObjectId],
      ref: "Doc",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
      getters: true,
    },
  }
);

// Enable auto-population for referenced documents
agendaSchema.plugin(mongooseAutoPopulate);
agendaSchema.virtual("photos", {
  ref: "Photo",
  localField: "_id",
  foreignField: "on",
  justOne: false,
});
agendaSchema.virtual("videos", {
  ref: "Video",
  localField: "_id",
  foreignField: "on",
  justOne: false,
});
agendaSchema.virtual("docs", {
  ref: "Doc",
  localField: "_id",
  foreignField: "on",
  justOne: false,
});
agendaSchema.virtual("gallery").get(function (this: IAgendaSchema) {
  return {
    photos: this.photos,
    videos: this.videos,
    docs: this.docs,
  };
});
// presences virtual removed due to decoupling

agendaSchema.methods.canMeRegisterAsCommittee = function (user?: IUser) {
  const member = user?.member;
  
  // Committee is usually redundant for Guests, assume Guest CANNOT be committee? 
  // "Committee" implies Member usually.
  if (user?.guest) return false;

  const organizer = member?.organizer;
  const now = new Date(Date.now());
  if (this.isRegisterd(user)) {
    return false;
  }
  // Enforce registration period only when configured
  if (this.configuration.committee.canRegisterUntil?.start && this.configuration.committee.canRegisterUntil?.end) {
    const start = new Date(this.configuration.committee.canRegisterUntil.start);
    const end = new Date(this.configuration.committee.canRegisterUntil.end);
    if (now < start || now > end) {
      return false;
    }
  }
  if (this.configuration.committee.canRegister === "Public") {
    // Only members can be committee? Or public too? Schema says "Public"
    return true;
  }
  if (this.configuration.committee.canRegister === "Organizer" && organizer) {
    return !!organizer;
  }
  if (this.configuration.committee.canRegister === "Member" && member) {
    return !!member;
  }
  if (typeof this.configuration.committee.canRegister === "string" && member) {
    const [roleName, value] =
      this.configuration.committee.canRegister.split(":");
    if (value == member[roleName as keyof IMember]) {
      return true;
    }
  }
  if (typeof this.configuration.committee.canRegister === "string" && member) {
    const [roleName, rawValue] =
      this.configuration.committee.canRegister.split("<");
    const memberValue = member[roleName as keyof IMember];
    const numValue = Number(rawValue);
    if (typeof memberValue === "number" && !isNaN(numValue)) {
      if (memberValue < numValue) {
        return true;
      }
    }
  }
  if (typeof this.configuration.committee.canRegister === "string" && member) {
    const [roleName, rawValue] =
      this.configuration.committee.canRegister.split(">");
    const memberValue = member[roleName as keyof IMember];
    const numValue = Number(rawValue);
    if (typeof memberValue === "number" && !isNaN(numValue)) {
      if (memberValue > numValue) {
        return true;
      }
    }
  }
  return false;
};

agendaSchema.methods.canMeRegisterAsParticipant = function (user?: IUser) {
  const member = user?.member;
  const guest = user?.guest;
  
  const organizer = member?.organizer;
  const now = new Date(Date.now());
  
  if (this.isRegisterd(user)) {
    return false;
  }
  // Enforce registration period only when configured
  if (this.configuration.participant.canRegisterUntil?.start && this.configuration.participant.canRegisterUntil?.end) {
    const start = new Date(this.configuration.participant.canRegisterUntil.start);
    const end = new Date(this.configuration.participant.canRegisterUntil.end);
    if (now < start || now > end) {
      return false;
    }
  }
  if (this.configuration.participant.canRegister === "Public") {
    return true; // Guests fall here
  }
  
  // If restricted, Guests usually can't register unless "Public"
  if (guest) return false;

  if (this.configuration.participant.canRegister === "Organizer" && organizer) {
    return !!organizer;
  }
  if (this.configuration.participant.canRegister === "Member" && member) {
    return !!member;
  }
  if (
    typeof this.configuration.participant.canRegister === "string" &&
    member
  ) {
    const [roleName, value] =
      this.configuration.participant.canRegister.split(":");
    if (value == member[roleName as keyof IMember]) {
      return true;
    }
  }
  if (
    typeof this.configuration.participant.canRegister === "string" &&
    member
  ) {
    const [roleName, rawValue] =
      this.configuration.participant.canRegister.split("<");
    const memberValue = member[roleName as keyof IMember];
    const numValue = Number(rawValue);
    if (typeof memberValue === "number" && !isNaN(numValue)) {
      if (memberValue < numValue) {
        return true;
      }
    }
  }
  if (
    typeof this.configuration.participant.canRegister === "string" &&
    member
  ) {
    const [roleName, rawValue] =
      this.configuration.participant.canRegister.split(">");
    const memberValue = member[roleName as keyof IMember];
    const numValue = Number(rawValue);
    if (typeof memberValue === "number" && !isNaN(numValue)) {
      if (memberValue > numValue) {
        return true;
      }
    }
  }
  return false;
};

agendaSchema.methods.isRegisterd = function (
  user?: IUser
): false {
  return false;
};

agendaSchema.methods.isRegisterdById = function (
  registeredId: string
): false {
  return false;
};

/**
 * Mongoose model for the Event collection.
 */
export const AgendaModel = model("Agenda", agendaSchema);
