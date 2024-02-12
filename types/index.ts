export interface ILink {
    name: string;
    href: string;
    current?: boolean;
}

export interface ICommittee {
    chief: string;
    viceChief: string;
    secretary: string;
    viceSecretary: string;
    treasurer: string;
    viceTreasurer: string;
    [key: string]: string;
}
export interface IEvent {
    title: string;
    date: Date;
    description: string;
    committee?: ICommittee
}