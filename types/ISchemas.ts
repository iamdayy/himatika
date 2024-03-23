import type { IUser, IProfile, IAddress, IEvent, ICommittee, ISession } from ".";
import type { Document } from "mongoose";
export interface IUserSchema extends IUser, Document {
    password: string;
}
export interface ISessionSchema extends ISession, Document {};
export interface IProfileSchema extends IProfile, Document {}
export interface IAddressSchema extends IAddress, Document {}

export interface ICommitteeSchema extends ICommittee, Document {}
export interface IEventSchema extends IEvent, Document {}