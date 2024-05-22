import type { IProfile, IProject, IUser } from ".";

interface IPaginateResponse {
    length: number;
}

export interface IRegisterResponse extends IUser {}
export interface IProjectResponse extends IPaginateResponse {
    projects: IProject[]
}

export interface IProfileResponse extends IPaginateResponse {
    profiles: IProfile[];
}