import mongoose, { model, Schema, Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { ICommittee, IMember, IParticipant } from "~~/types";
import {
  IAgendaConfigurationSchema,
  IAgendaSchema,
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
  canMeRegisterAsParticipant(member?: IMember): boolean;
  canMeRegisterAsCommittee(member?: IMember): boolean;
  isRegisterd(member?: IMember): ICommittee | IParticipant | false;
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
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  NIM: {
    type: Number,
    unique: true,
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

const paymentSchema = new Schema<IPaymentSchema>({
  method: {
    type: String,
    enum: ["cash", "bank_transfer", "qris"],
    required: true,
    default: "cash",
  },
  status: {
    type: String,
    default: "pending",
    enum: ["pending", "canceled", "success", "expired", "failed"],
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
    unique: true,
    sparse: true,
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
    unique: true,
    sparse: true,
    autopopulate: {
      select: "NIM avatar fullName email class semester createdAt",
    },
  },
  guest: {
    type: IGuestSchema,
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
    registerLink: {
      type: String,
    },
    configuration: {
      type: configurationSchema,
      default: {},
    },
    committees: {
      type: [CommitteeSchema],
      default: [],
    },
    participants: {
      type: [participantSchema],
      default: [],
      autopopulate: {
        path: "answers",
      },
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
agendaSchema.virtual("presences").get(function (this: IAgendaSchema) {
  return {
    commiittees: this.committees?.filter(
      (committee) => committee.visitTime !== undefined
    ),
    participants: this.participants?.filter(
      (participant) => participant.visitTime !== undefined
    ),
  };
});
agendaSchema.methods.canMeRegisterAsCommittee = function (member?: IMember) {
  const organizer = member?.organizer;
  const now = new Date(Date.now());
  const start = new Date(
    this.configuration.committee.canRegisterUntil?.start || Date.now()
  );
  const end = new Date(
    this.configuration.committee.canRegisterUntil?.end || Date.now()
  );
  if (this.isRegisterd(member)) {
    return false;
  }
  if (now < start || now > end) {
    return false;
  }
  if (this.configuration.committee.canRegister === "Public") {
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
    const [roleName, value] =
      this.configuration.committee.canRegister.split("<");
    if (value < (member[roleName as keyof IMember] ?? 0)) {
      return true;
    }
  }
  if (typeof this.configuration.committee.canRegister === "string" && member) {
    const [roleName, value] =
      this.configuration.committee.canRegister.split(">");
    if (value > (member[roleName as keyof IMember] ?? 0)) {
      return true;
    }
  }
  return false;
};
agendaSchema.methods.canMeRegisterAsParticipant = function (member?: IMember) {
  const organizer = member?.organizer;
  const now = new Date(Date.now());
  const start = new Date(
    this.configuration.participant.canRegisterUntil?.start || Date.now()
  );
  const end = new Date(
    this.configuration.participant.canRegisterUntil?.end || Date.now()
  );
  if (this.isRegisterd(member)) {
    return false;
  }
  if (now < start || now > end) {
    return false;
  }
  if (this.configuration.participant.canRegister === "Public") {
    return true;
  }
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
    const [roleName, value] =
      this.configuration.participant.canRegister.split("<");
    if (value < (member[roleName as keyof IMember] ?? 0)) {
      return true;
    }
  }
  if (
    typeof this.configuration.participant.canRegister === "string" &&
    member
  ) {
    const [roleName, value] =
      this.configuration.participant.canRegister.split(">");
    if (value > (member[roleName as keyof IMember] ?? 0)) {
      return true;
    }
  }
  return false;
};
agendaSchema.methods.isRegisterd = function (
  member?: IMember
): ICommittee | IParticipant | false {
  if (!member) return false;
  const committee = this.committees?.find(
    (item) => (item.member as IMember | undefined)?.NIM == member.NIM
  );
  if (committee) return committee;
  const participant = this.participants?.find(
    (item) => (item.member as IMember | undefined)?.NIM == member.NIM
  );
  if (participant) return participant;
  return false;
};
agendaSchema.methods.isRegisterdById = function (
  registeredId: string
): ICommittee | IParticipant | false {
  const committee = this.committees?.find(
    (item) => item._id?.toString() == registeredId
  );
  if (committee) return committee;
  const participant = this.participants?.find(
    (item) => item._id?.toString() == registeredId
  );
  if (participant) return participant;
  return false;
};

/**
 * Mongoose model for the Event collection.
 */
export const AgendaModel = model("Agenda", agendaSchema);
