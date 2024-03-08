import type { IUser } from ".";
export interface ILoginResponse {
    token: string;
    token_re: string;
    user: IUser;
}

export interface IRegisterResponse extends IUser {}