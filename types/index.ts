import { Types } from "mongoose";
import type { DatePickerRangeObject } from "v-calendar/dist/types/src/use/datePicker.js";
/**
 * Defines the possible roles for users in the system.
 */
export type TRole =
  | "Public"
  | "Organizer"
  | "Member"
  | string
  | "None"
  | "Committee"
  | "Participant";
export interface ICarousel {
  title: string;
  description: string;
  image?: IPhoto;
  date: Date;
}
export type IConfig = {
  name: string;
  description: string;
  vision: string;
  mission: string[];
  address: string;
  socialMedia: { name: string; url: string }[];
  contact: {
    email: string;
    phone: string;
  };
  dailyManagements: string[];
  departments: string[];
  carousels?: ICarousel[];
  enscriptActivinessLetter?: string | IEncryption | Types.ObjectId;
  minPoint?: number;
};

export interface IFile {
  name: string;
  content: string | ArrayBuffer | Blob;
  size: string;
  type: string;
  lastModified: string;
}

/**
 * Represents a link with a name, href, and optional current status.
 */
export interface ILink {
  label: string;
  to: string;
  current?: boolean;
}

/**
 * Represents an address with detailed location information.
 */
export interface IAddress {
  fullAddress: string;
  village: string;
  district: string;
  city: string;
  province: string;
  country: string;
  zip: number;
}

export interface IPoint {
  semester: number;
  range: {
    start: Date;
    end: Date;
  };
  point: number;
  activities: {
    agendas: {
      committees: number;
      participants: number;
    };
    projects: number;
    aspirations: number;
    manualPoints: number;
  };
}

/**
 * Represents a user member with personal and academic information.
 */
export interface IMember {
  id?: string;
  NIM: number;
  fullName: string;
  avatar?: string;
  class: string;
  semester: number;
  birth?: {
    place: string;
    date: Date;
  };
  sex: "female" | "male";
  religion?: string;
  citizen?: string;
  phone?: string;
  email: string;
  address?: IAddress;
  status?: "active" | "inactive" | "free" | "deleted";
  point?: IPoint[];
  enteredYear: number;
  agendas?: {
    committees?: IAgenda[];
    members?: IAgenda[];
  };
  agendasMember?: IAgenda[];
  agendasCommittee?: IAgenda[];
  projects?: IProject[];
  aspirations?: IAspiration[];
  manualPoints?: IPointLog[];
  documents?: IDoc[];
  docsRequestSign?: IDoc[];
  organizer?: {
    role: string;
    period: IPeriod;
  };
  organizersConsiderationBoard?: IOrganizer[];
  organizersDailyManagement?: IOrganizer[];
  organizersDepartmentCoordinator?: IOrganizer[];
  organizersDepartmentMembers?: IOrganizer[];
}

export interface IGuest {
  fullName: string;
  email: string;
  phone: string;
  NIM?: number;
  class?: string;
  semester?: number;
  prodi?: string;
  instance?: string;
}

/**
 * Represents a user account with authentication information.
 */
export interface IUser {
  member: IMember;
  username: string;
  key?: string;
  token?: string;
  verified?: boolean;
}

/**
 * Represents a user session with authentication tokens.
 */
export interface ISession {
  token: string;
  refreshToken: string;
  previousRefreshToken?: string;
  user: Types.ObjectId | IUser;
}

/**
 * Represents a time period with start and end dates.
 */
export interface IPeriod {
  start: Date;
  end: Date;
}

/**
 * Represents an organizer with daily management and department details.
 */

export interface IDailyManagement {
  position: string;
  member: Types.ObjectId | IMember | number;
}

export interface IDepartment {
  name: string;
  coordinator: Types.ObjectId | IMember | number;
  members: Types.ObjectId[] | IMember[] | number[];
}

export interface IOrganizer {
  _id?: string | Types.ObjectId;
  council: {
    name: string;
    image: string | IFile;
    position: string;
  }[];
  advisor: {
    name: string;
    image: string | IFile;
    position: string;
  };
  considerationBoard: IMember[] | number[] | Types.ObjectId[];
  dailyManagement: IDailyManagement[];
  department: IDepartment[];
  period: IPeriod;
}
/**
 * Represents a committee member for an event.
 */
export interface ICommittee {
  _id?: string | Types.ObjectId;
  job: string;
  member: IMember | string | number | Types.ObjectId | undefined;
  approved: boolean;
  approvedAt?: Date;
  visiting?: boolean;
  visitAt?: string;
  visitTime?: Date;
  payment?: IPayment;
  reqruitments?:
    | { approved: boolean }[]
    | (IReqruitment & { approved: boolean }[]);
  answers?: IAnswer[];
}

/**
 * Represents a contributor to a project.
 */
export interface IContributor {
  member: IMember | Types.ObjectId | number | string;
  job: string;
}
export type IPaymentMethod = "cash" | "bank_transfer" | "e_wallet" | "qris";
export type TPaymentStatus =
  | "pending"
  | "success"
  | "failed"
  | "canceled"
  | "expired";
export interface IPayment {
  method: IPaymentMethod;
  status?: TPaymentStatus;
  order_id?: string;
  transaction_id?: string;
  bank?: string;
  va_number?: string;
  qris_png?: string;
  time?: Date;
  expiry?: Date;
}

/**
 * Represents a participant participant for an event or project.
 */
export interface IParticipant {
  _id?: string | Types.ObjectId;
  member?: Types.ObjectId | IMember | number;
  guest?: IGuest;
  visiting?: boolean;
  visitAt?: string;
  visitTime?: Date;
  payment?: IPayment;
  reqruitments?:
    | { approved: boolean }[]
    | (IReqruitment & { approved: boolean }[]);
  answers?: IAnswer[];
}

/**
 * Represesnt a category for a project or agenda.
 */
export interface ICategory {
  _id?: string | Types.ObjectId | unknown;
  title: string;
  description: string;
  slug?: string;
}

export interface IJob {
  label: string;
  count: number;
}

export interface IReqruitment {
  label: string;
  description: string;
}

export interface IAgendaCommitteeConfiguration {
  pay: boolean;
  amount: number;
  point: number;
  canRegister?: TRole;
  canRegisterUntil: {
    start: Date;
    end: Date;
  };
  reqruitments?: IReqruitment[];
  jobAvailables?: IJob[];
  questions?: IQuestion[] | Types.ObjectId[];
}

export interface IAgendaParticipantConfiguration {
  pay: boolean;
  amount: number;
  point: number;
  reqruitments?: IReqruitment[];
  canRegister?: TRole;
  canRegisterUntil: {
    start: Date;
    end: Date;
  };
  questions?: IQuestion[] | Types.ObjectId[];
}

export interface IAgendaConfiguration {
  canSee?: TRole;
  canSeeRegistered?: TRole;
  onlyParticipantCanVisit?: boolean;
  messageAfterRegister?: string;
  committee: IAgendaCommitteeConfiguration;
  participant: IAgendaParticipantConfiguration;
}

/**
 * Represents an agenda with details, committee, and registration information.
 */
export interface IAgenda {
  _id?: string | Types.ObjectId | unknown;
  title: string;
  category?: ICategory | Types.ObjectId | string;
  tags?: string[];
  date: DatePickerRangeObject;
  at: string;
  atLink: string;
  description: string;
  registerLink?: string;
  configuration: IAgendaConfiguration;
  committees?: ICommittee[];
  participants?: IParticipant[];
  presences?: {
    committees?: ICommittee[];
    participants?: IParticipant[];
  };
  gallery?: {
    photos?: IPhoto[];
    videos?: IVideo[];
    docs?: IDoc[];
  };
  photos?: IPhoto[];
  videos?: IVideo[];
  docs?: IDoc[];
}

/**
 * Represents a project with details, contributors, and registration information.
 */
export interface IProject {
  _id?: string | Types.ObjectId | unknown; // Optional, MongoDB will auto-generate _id if not provided
  title: string;
  image: string | File;
  description: string;
  category: ICategory | string | Types.ObjectId; // E.g., 'article', 'poster', 'video', 'application', etc.
  date: Date;
  progress: number; // E.g., 0 to 100
  url?: string; // Link to the work if available, e.g., YouTube video URL, GitHub repository link, etc.
  members: IMember[] | Types.ObjectId[] | number[] | string[]; // Array of members who contributed to this work
  tags?: string[]; // Optional, for categories or tags, e.g., 'technology', 'art', 'social', etc.
  published?: boolean;
  publishedAt?: Date;
  photos?: IPhoto[]; // Optional, for adding photos related to the project
}

/**
 * Represents a blog news with content, author, and publishing information.
 */
export interface INews {
  _id?: string | Types.ObjectId | unknown;
  title: string;
  mainImage: string | File; // URL of the main image
  body: string;
  slug?: string;
  category: ICategory | Types.ObjectId | string; // E.g., 'article', 'poster', 'video', 'application', etc.
  authors?: Types.ObjectId[] | IMember[] | number[];
  tags?: string[];
  likes?: {
    by: "Guest" | "Member";
    member?: Types.ObjectId | IMember;
    ip?: string | string[];
  }[];
  comments?: IComment[] | Types.ObjectId[];
  archived?: boolean;
  archivedAt?: Date;
  published?: boolean;
  publishedAt?: Date;
  related?: INews[]; // Virtual field for related newss
}

export interface IPhoto {
  _id?: string | Types.ObjectId | unknown;
  image: string | File;
  tags?: string[];
  uploader?: Types.ObjectId | IMember | number;
  archived: boolean;
  archivedAt?: Date;
  on?: Types.ObjectId | IProject | IAgenda;
  onModel?: "Project" | "Agenda" | "Aspiration";
}
export interface IVideo {
  _id?: string;
  video: string | File;
  tags: string[];
  uploader?: Types.ObjectId | IMember | number;
  archived: boolean;
  archivedAt?: Date;
  on?: Types.ObjectId | IProject | IAgenda;
  onModel?: "Project" | "Agenda" | "Aspiration";
  thumbnail?: string | IFile;
}

export interface IPrivateKey {
  encrypted_key: string;
  metadata: {
    iv: string;
    key: string;
    tag?: string;
  };
}

export interface IEncryption {
  _id?: string | Types.ObjectId;
  title: string;
  private_key: IPrivateKey;
  public_key: string;
}

export interface ISign {
  user: Types.ObjectId | IMember | number;
  documentHash: string;
  encryption: IEncryption | Types.ObjectId | string;
  signature: string;
  document?: IDoc;
}
export interface IRequestSign {
  user: Types.ObjectId | IMember | number;
  signed: boolean;
  signedAt?: Date;
  signedIp?: string;
  as: string;
  sign?: ISign | Types.ObjectId | string;
}
export const enum Action {
  SIGN = "SIGN",
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  ARCHIVE = "ARCHIVE",
  UNARCHIVE = "UNARCHIVE",
  APPROVE = "APPROVE",
  REJECT = "REJECT",
}
export type TAction = `${Action}` | string;
export interface ITrail {
  user: Types.ObjectId | IMember | number;
  action: TAction;
  actionAt: Date;
  actionIp: string;
  doc?: string;
}
export interface IDoc {
  _id?: string;
  label: string;
  no: string;
  doc: string | File;
  tags: string[];
  uploader?: Types.ObjectId | IMember | number;
  archived: boolean;
  signs?: IRequestSign[];
  archivedAt?: Date;
  on?: Types.ObjectId | IProject | IAgenda;
  onModel?: "Project" | "Agenda" | "Aspiration";
  trails?: ITrail[];
}

export interface IPhotoGrouped {
  _id?: string | Types.ObjectId;
  title: string;
  slug?: string;
  description?: string;
  photos: IPhoto[];
  type: "project" | "agenda";
}
export interface IVideoGrouped {
  _id?: string | Types.ObjectId;
  title: string;
  slug?: string;
  description?: string;
  videos: IVideo[];
  type: "project" | "agenda";
}
export interface IDocGrouped {
  _id?: string | Types.ObjectId | unknown;
  title: string;
  slug?: string;
  description?: string;
  docs: IDoc[];
  type: "project" | "agenda";
}

export interface IVote {
  user: Types.ObjectId | IMember | string;
  voteType: "upvote" | "downvote";
}
export interface IComment {
  _id?: string;
  body: string;
  author: Types.ObjectId | IMember;
  likes?: {
    by: "Guest" | "Member";
    member?: Types.ObjectId | IMember;
    ip?: string | string[];
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAspiration {
  _id?: string | Types.ObjectId;
  subject: string;
  message: string;
  from?: IMember | Types.ObjectId | number | undefined;
  proofs?: {
    photos?: IPhoto[];
    videos?: IVideo[];
    docs?: IDoc[];
  };
  votes?: IVote[];
  totalVotes?: number;
  anonymous: boolean;
  read?: boolean;
  archived?: boolean;
  deleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface IMessage {
  name: {
    first: string;
    last: string;
  };
  email: string;
  phone: string;
  subject: string;
  message: string;
  tags: string[];
  archived?: boolean;
}

export interface IOTP {
  email: string;
  NIM: number;
  code: string;
  type:
    | "Verify Account"
    | "Change Password"
    | "Reset Password"
    | "Change Email"
    | "Change Phone"
    | "Verify Email"
    | "Verify Phone";
  expiresAt: Date;
}
export interface IAnswer {
  _id?: string | Types.ObjectId;
  question: Types.ObjectId | IQuestion;
  value: any;
  answerer: Types.ObjectId | IMember | number;
}
export interface IOption {
  _id: Types.ObjectId | string;
  value: any;
}
export interface IQuestion {
  _id?: Types.ObjectId | string;
  question: string;
  type: string;
  options: IOption[];
  max?: number;
  min?: number;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  required: boolean;
  answer?: any;
}

/**
 * Represents the location and dimensions for placing an overlay on a PDF page.
 * Coordinates are measured from the bottom-left corner of the page.
 */
export interface IOverlayLocation {
  text: string;
  page: number;
  x: number; // Koordinat X (dari kiri halaman)
  y: number; // Koordinat Y (dari bawah halaman)
  width: number;
  height: number;
}

export interface IPointLog {
  member: Types.ObjectId | IMember | number;
  admin?: Types.ObjectId | IUser | number;
  amount: number;
  reason: string;
  description?: string;
  type?: "achievement" | "activity";
  proof?: string;
  status?: "pending" | "approved" | "rejected";
  date?: Date;
}
