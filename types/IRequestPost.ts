import type { IProfile } from ".";

export interface IReqRegister {
    username: string;
    NIM: number;
    password: string;
}

export interface IReqProfile extends IProfile {}