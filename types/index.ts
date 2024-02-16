export interface ILink {
    name: string;
    href: string;
    current?: boolean;
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
    contributors: IContributor[];
}