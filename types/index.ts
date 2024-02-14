export interface ILink {
    name: string;
    href: string;
    current?: boolean;
}

export interface ICommittee {
    job: string;
    name: string;
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