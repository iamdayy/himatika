import { Types } from "mongoose";
export interface ISetSessionParams {
    accessToken: string;
    token: string;
    user: Types.ObjectId;
}