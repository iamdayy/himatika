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
    title: string;
    date: Date;
    description: string;
    committee?: ICommittee[];
}