import { Types } from "mongoose"

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
        place: string,
        date: Date,
    };
    sex: 'Laki-Laki' | 'Perempuan';
    religion: string;
    citizen: string;
    phone: string;
    email: string;
    address: IAddress;
    isRegistered: boolean;
}

export interface IUser  {
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

export interface IAdministrator {
    chairman: Types.ObjectId | IProfile | number;
    viceChairman: Types.ObjectId | IProfile | number;
    secretary: Types.ObjectId | IProfile | number;
    viceSecretary: Types.ObjectId | IProfile | number;
    treasurer: Types.ObjectId | IProfile | number;
    viceTreasurer: Types.ObjectId | IProfile | number;
    period: IPeriod;
}

export interface ICommittee {
    job: string;
    user: IProfile | string;
}
export interface IContributor {
    name: string;
    job: string;
}
export interface IEvent {
    title: string;
    date: Date;
    at: string;
    accessbility: string;
    description: string;
    committee: ICommittee[];
}

export interface IProject {
    id: number;
    title: string;
    deadline: Date;
    description: string;
    hidden: boolean;
    contributors?: IContributor[];
}