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

export interface IPeriod {
    start: Date;
    end: Date;
}

export interface IAdministrator {
    user_id: string;
    division: string;
    period: IPeriod;
}

export interface ICommittee {
    job: string;
    name: string;
}
export interface IContributor {
    name: string;
    job: string;
}
export interface IEvent {
    id: number;
    title: string;
    date: Date;
    at: string;
    accessbility: string;
    description: string;
    committee?: ICommittee[];
}

export interface IProject {
    id: number;
    title: string;
    deadline: Date;
    description: string;
    hidden: boolean;
    contributors?: IContributor[];
}