import mongoose, { Schema } from "mongoose";
import { IAgenda, IMember, IPoint, IPointLog } from "~~/types";
import { IAddressSchema, IMemberSchema } from "~~/types/ISchemas";
import { AgendaModel } from "./AgendaModel";
import { ProjectModel } from "./ProjectModel";
import { UserModel } from "./UserModel";

interface MemberMethods {
  calculatePoints: (
    rangeDate: { start: Date; end: Date },
    semester: number
  ) => IPoint;
}
interface MemberModel
  extends mongoose.Model<IMemberSchema, {}, MemberMethods> {}
/**
 * Schema for representing an address.
 */
const AddressSchema = new Schema<IAddressSchema>({
  fullAddress: String,
  village: String,
  district: String,
  city: String,
  province: String,
  country: String,
  zip: Number,
});

/**
 * Schema for representing a user member.
 */
const memberSchema = new Schema<IMemberSchema, MemberModel, MemberMethods>(
  {
    NIM: {
      type: Number,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    class: {
      type: String,
    },
    semester: {
      type: Number,
      default: 1,
    },
    birth: {
      type: {
        place: String,
        date: Date,
      },
      default: {
        place: "",
        date: new Date(),
      },
    },
    sex: {
      type: String,
      enum: ["female", "male"],
      default: "male",
    },
    religion: {
      type: String,
      default: "",
    },
    citizen: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      index: true,
      trim: true,
      unique: true,
      sparse: true,
    },
    address: {
      type: AddressSchema,
      default: {
        fullAddress: "",
        village: "",
        district: "",
        city: "",
        province: "",
        country: "",
        zip: 0,
      },
    },
    enteredYear: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "free", "deleted"],
      default: "free",
    },
    badges: [
      {
        type: Schema.Types.ObjectId,
        ref: "Badge",
      },
    ],
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

/**
 * Method to calculate points for the member.
 * This is a placeholder and should be implemented based on your logic.
 */
memberSchema.methods.calculatePoints = function (rangeDate, semester): IPoint {
  const agendasCommittee = (this.agendasCommittee || [])
    .filter((agenda: IAgenda) => {
      if (agenda.date.start < rangeDate.start) {
        return false; // Skip agendas before the start date
      }
      if (agenda.date.end > rangeDate.end) {
        return false; // Skip agendas after the end date
      }
      if (rangeDate.start && rangeDate.end) {
        // If both start and end dates are provided, check if the agenda falls within this range
        return (
          agenda.date.start >= rangeDate.start &&
          agenda.date.end <= rangeDate.end
        );
      }
    })
    .filter(
      (agenda: IAgenda) =>
        agenda.committees?.find(
          (c) => (c.member as IMember).NIM === this.NIM && c.visiting
        ) === undefined
    );
  const agendasMember = (this.agendasMember || [])
    .filter((agenda: IAgenda) => {
      if (agenda.date.start < rangeDate.start) {
        return false; // Skip agendas before the start date
      }
      if (agenda.date.end > rangeDate.end) {
        return false; // Skip agendas after the end date
      }
      if (rangeDate.start && rangeDate.end) {
        // If both start and end dates are provided, check if the agenda falls within this range
        return (
          agenda.date.start >= rangeDate.start &&
          agenda.date.end <= rangeDate.end
        );
      }
    })
    .filter(
      (agenda: IAgenda) =>
        agenda.participants?.find(
          (r) => (r.member as IMember).NIM === this.NIM && r.visiting
        ) === undefined
    );
  const committeesAgenda =
    agendasCommittee?.reduce(
      (acc: number, agenda: IAgenda) =>
        acc + agenda.configuration.committee.point,
      0
    ) || 0;
  const membersAgenda =
    agendasMember?.reduce(
      (acc: number, agenda: IAgenda) =>
        acc + agenda.configuration.participant.point,
      0
    ) || 0;
  const projects = (this.projects || []).filter((project) => {
    if (!project.published) {
      return false; // Skip unpublished projects
    }
    if (!project.date) {
      return false; // Skip projects without a date
    }
    if (rangeDate.start >= project.date && rangeDate.end <= project.date) {
      return true; // Include projects that fall within the date range
    }
    // If both start and end dates are provided, check if the project
  });
  const projectsPoint =
    projects.reduce((acc: number, project) => acc + 75, 0) || 0;
  const aspirations = (this.aspirations || []).filter((asp) => {
    if (asp.deleted) {
      return false; // Skip deleted aspirations
    }
    if (asp.archived) {
      return false; // Skip archived aspirations
    }
    if (
      asp.createdAt &&
      rangeDate.start >= asp.createdAt &&
      rangeDate.end <= asp.createdAt
    ) {
      return true; // Include aspirations that fall within the date range
    }
  });
  const aspirationsPoint =
    aspirations.reduce((acc: number, asp) => acc + 50, 0) || 0;

  // Ambil dari virtual 'manualPoints'
  const manualPointsLog = (this.manualPoints || []).filter((p: IPointLog) => {
    // 1. Cek Tanggal (Semester)
    if (!p.date) return false;
    const pDate = new Date(p.date);
    const isDateValid = pDate >= rangeDate.start && pDate <= rangeDate.end;

    // 2. Cek Status (WAJIB APPROVED)
    const isApproved = p.status === "approved";

    return isDateValid && isApproved;
  });

  const manualTotal =
    manualPointsLog.reduce((acc: number, p: IPointLog) => acc + (p.amount || 0), 0) ||
    0;

  const total =
    committeesAgenda +
    membersAgenda +
    projectsPoint +
    aspirationsPoint +
    manualTotal;
  // Check if total is NaN and return 0 if it is
  // if (isNaN(total)) {
  //   return 0;
  // }
  // // Check if total is undefined and return 0 if it is
  // if (total === undefined) {
  //   return 0;
  // }
  // // Check if total is null and return 0 if it is
  // if (total === null) {
  //   return 0;
  // }
  return {
    semester: semester,
    range: rangeDate,
    point: total,
    activities: {
      agendas: {
        committees: agendasCommittee.length,
        participants: agendasMember.length,
      },
      projects: projects?.length || 0,
      aspirations: aspirations?.length || 0,
      manualPoints: manualPointsLog.length,
    },
  };
};

/**
 * Virtual field to get the projects associated with the member.
 */
memberSchema.virtual("projects", {
  ref: "Project",
  localField: "_id",
  foreignField: "members",
  match: {
    published: true,
  },
});

/**
 * Virtual field to get the agendas associated with the member.
 */
memberSchema.virtual("agendasMember", {
  ref: "Agenda",
  localField: "_id",
  foreignField: "participants.member",
});

/**
 * Virtual field to get the agendas associated with the committee.
 */
memberSchema.virtual("agendasCommittee", {
  ref: "Agenda",
  localField: "_id",
  foreignField: "committees.member",
  match: {
    "committees.approved": true,
  },
});

memberSchema.virtual("agendas").get(function () {
  return {
    committees: this.agendasCommittee,
    members: this.agendasMember,
  };
});
memberSchema.virtual("manualPoints", {
  ref: "PointLog", // Harus sama dengan nama model di mongoose.model('PointLog', ...)
  localField: "_id",
  foreignField: "member",
  match: {
    status: "approved",
  },
});

memberSchema.virtual("point").get(function () {
  const semester = this.semester || 1;
  const enteredYear = this.enteredYear;
  const range = new Date().getFullYear() - enteredYear + 1; // Calculate the number of semesters since enteredYear
  if (range <= 0) {
    return 0; // No points if the entered year is in the future
  }
  // Generate an array of date ranges for each semester
  // Each semester is assumed to be 6 months long
  const SEPTEMBER_MONTH = 8; // JavaScript months are 0-indexed: September = 8
  const rangeDates = Array.from({ length: semester }, (_, i) => {
    const semester = i + 1; // Semester number starts from 1
    // Semester starts in September (month 8, 0-indexed) and ends in February (month 1)
    // Adjust the month calculation based on the semester number
    const startMonth = (semester - 1) * 6 + SEPTEMBER_MONTH;
    const endMonth = startMonth + 5; // 6 months later
    const start = new Date(enteredYear, startMonth, 1); // Start of the semester
    const end = new Date(enteredYear, endMonth + 1, 0);
    return {
      start,
      end,
      semester, // Semester number starts from 1
    };
  });
  // Calculate points based on the member's semester and activities
  if (semester > 14) {
    return 0; // No points for members beyond semester 14
  }
  if (this.status === "deleted") {
    return 0; // No points for deleted members
  }
  if (this.status === "inactive") {
    return 0; // No points for inactive members
  }
  if (this.status === "free") {
    return 0; // No points for free members
  }
  // Calculate points for active members
  if (this.status === "active") {
    return rangeDates.map((range) => {
      const point = this.calculatePoints(
        {
          start: range.start,
          end: range.end,
        },
        range.semester
      );
      return point;
    });
  }
  return 0; // Default case, no points
});

memberSchema.virtual("documents", {
  ref: "Doc",
  localField: "_id",
  foreignField: "uploader",
});

// Virtual for considerationBoards
memberSchema.virtual("organizersConsiderationBoard", {
  ref: "Organizer",
  localField: "_id",
  foreignField: "considerationBoard",
  justOne: true,
  match: {
    "period.end": { $gte: new Date() },
  },
});

// Virtual for dailyManagement
memberSchema.virtual("organizersDailyManagement", {
  ref: "Organizer",
  localField: "_id",
  foreignField: "dailyManagement.member",
  justOne: true,
  match: {
    "period.end": { $gte: new Date() },
  },
});

// Virtual for department coordinator
memberSchema.virtual("organizersDepartmentCoordinator", {
  ref: "Organizer",
  localField: "_id",
  foreignField: "department.coordinator",
  justOne: true,
  match: {
    "period.end": { $gte: new Date() },
  },
});

// Virtual for department members
memberSchema.virtual("organizersDepartmentMembers", {
  ref: "Organizer",
  localField: "_id",
  foreignField: "department.members",
  justOne: true,
  match: {
    "period.end": { $gte: new Date() },
  },
});
memberSchema.virtual("aspirations", {
  ref: "Aspiration",
  localField: "_id",
  foreignField: "from",
});

// Combine all organizers
memberSchema.virtual("organizer").get(function () {
  return (
    this.organizersDailyManagement ||
    this.organizersConsiderationBoard ||
    this.organizersDepartmentCoordinator ||
    this.organizersDepartmentMembers
  );
});

// Create a text index for searching members
// memberSchema.index({ NIM: "text", fullName: "text", email: "text" });
/**
 * Pre-save middleware to check the semester value before saving.
 */
memberSchema.pre("save", function () {
  if (this.isModified("semester")) {
    if (this.semester > 14) {
      this.status = "inactive";
      this.save();
      return;
    }
  }
});

/**
 * Post-save middleware to handle member deletion.
 * Removes the member from associated projects, events, and deletes the user.
 */
memberSchema.post("save", async function (next) {
  const member = this;
  const memberId = this._id;
  if (member.status == "deleted") {
    await ProjectModel.updateMany(
      {
        $or: [{ members: memberId }],
      },
      {
        $pull: {
          members: memberId,
        },
      }
    );
    await AgendaModel.updateMany(
      {
        $or: [
          { "committee.user": memberId },
          { "registered.member": memberId },
        ],
      },
      {
        $pull: {
          committee: { user: memberId },
          registered: { member: memberId },
        },
      }
    );
    await UserModel.findOneAndDelete({ member });
  }
});

/**
 * Mongoose model for the Member collection.
 */
export const MemberModel = mongoose.model<IMemberSchema>(
  "Member",
  memberSchema
);
