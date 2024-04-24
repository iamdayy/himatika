import type { IUser, IProfile, IAddress, IEvent, ICommittee, ISession, IDepartement, IAdministrator, IProject, IContributor, IAdministratorMember } from ".";
import type { Document } from "mongoose";
export interface IUserSchema extends IUser, Document {
    password: string;
}
export interface ISessionSchema extends ISession, Document {};
export interface IProfileSchema extends IProfile, Document {};
export interface IDepartementSchema extends IDepartement, Document {};
export interface IAdministratorMemberSchema extends IAdministratorMember, Document {};
export interface IAdministratorSchema extends IAdministrator, Document {};
export interface IAddressSchema extends IAddress, Document {};

export interface ICommitteeSchema extends ICommittee, Document {};
export interface IEventSchema extends IEvent, Document {};

export interface IContributorSchema extends IContributor, Document {};
export interface IProjectSchema extends IProject, Document {};