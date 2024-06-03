import type { IEvent, IProfile } from ".";

interface IReqQueryPaginate {
  perPage: number;
  page: number;
}

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

export interface IReqProfileQuery extends IReqQueryPaginate {
  NIM: string;
  fullName: string;
  // NIM: number;
  email: string;
}

export interface IReqProfile extends IProfile {}

export interface IReqEvent extends IEvent {}

export interface IReqProjectQuery extends IReqQueryPaginate {
  id: string;
}
