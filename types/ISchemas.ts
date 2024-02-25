import type { IUser, IProfile, IAddress } from ".";
import type { Document } from "mongoose";
export interface IUserSchema extends IUser, Document {
    password: string;
}
export interface IProfileSchema extends IProfile, Document {}
export interface IAddressSchema extends IAddress, Document {}