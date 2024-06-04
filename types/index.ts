import { Types } from "mongoose";
export type TRole =
  | "Admin"
  | "Departement"
  | "Internal"
  | "All"
  | "External"
  | "No";
export interface ILink {
  name: string;
  href: string;
  current?: boolean;
}

export interface IAddress {
  fullAddress: string;
  village: string;
  district: string;
  city: string;
  province: string;
  country: string;
  zip: number;
}

export interface IProfile {
  NIM: number;
  fullName: string;
  avatar: string;
  class: string;
  semester: number;
  birth: {
    place: string;
    date: Date;
  };
  sex: "female" | "male";
  religion: string;
  citizen: string;
  phone: string;
  email: string;
  address: IAddress;
  isRegistered: boolean;
  enteredYear?: number;
  events?: IEvent[];
  projects?: IProject[];
  isAdministrator?: IAdministrator;
  isDepartement?: IDepartement;
}

export interface IUser {
  profile: IProfile;
  username: string;
  key?: string;
  token?: string;
}

export interface ISession {
  accessToken: string;
  token: string;
  user: Types.ObjectId | IUser;
}

export interface IPeriod {
  start: Date;
  end: Date;
}

export interface IDepartement {
  profile: Types.ObjectId | IProfile | number;
  departement: string;
  period: IPeriod;
}

export interface IAdministratorMember {
  role: string;
  profile: Types.ObjectId | IProfile | number;
}
export interface IAdministrator {
  AdministratorMembers: IAdministratorMember[];
  period: IPeriod;
}

export interface ICommittee {
  job: string;
  user: IProfile | string | number;
}

export interface IContributor {
  profile: IProfile | Types.ObjectId | number | string;
  job: string;
}
export interface IRegistered {
  profile: Types.ObjectId | IProfile | number;
  task?: string;
}
export interface IEvent {
  _id?: number | string;
  title: string;
  date: Date;
  at: string;
  canSee: TRole;
  description: string;
  committee: ICommittee[];
  canRegister: TRole;
  registered?: IRegistered[];
}

export interface IProject {
  _id?: string;
  title: string;
  deadline: Date;
  description: string;
  canSee: TRole;
  contributors?: IContributor[];
  canRegister: TRole;
  tasks?: string[];
  registered?: IRegistered[];
}
