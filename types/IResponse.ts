import type { IProject, IUser } from ".";

interface IPaginateResponse {
    length: number;
}

export interface IRegisterResponse extends IUser {}
export interface IProjectResponse extends IPaginateResponse {
    projects: IProject[]
}