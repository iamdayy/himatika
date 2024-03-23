import type { IEvent, IProfile } from ".";

export interface IReqRegister {
    username: string;
    NIM: number;
    password: string;
}

export interface IReqLogin {
    username: string;
    password: string;
}

export interface IReqAuth extends IReqRegister, IReqLogin {
    password_confirmation: string;
}

export interface IReqProfile extends IProfile {}

export interface IReqEvent extends IEvent {}