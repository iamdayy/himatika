import type { Document } from "mongoose";
import type {
  IAddress,
  IAgenda,
  IAgendaCommitteeConfiguration,
  IAgendaConfiguration,
  IAgendaParticipantConfiguration,
  IAnswer,
  IAspiration,
  ICategory,
  IComment,
  ICommittee,
  IConfig,
  IContributor,
  IDailyManagement,
  IDepartment,
  IDoc,
  IGuest,
  IJob,
  IMember,
  IMessage,
  INews,
  IOption,
  IOrganizer,
  IOTP,
  IParticipant,
  IPayment,
  IPhoto,
  IProject,
  IQuestion,
  IReqruitment,
  IRequestSign,
  ISession,
  ITrail,
  IUser,
  IVideo,
} from ".";

/**
 * Extends the IUser interface with Document and adds a password field.
 */
export interface IUserSchema extends Omit<IUser, "id">, Document {
  password: string;
}

/**
 * Extends the ISession interface with Document and adds timestamp fields.
 */
export interface ISessionSchema extends ISession, Document {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extends the IConfig interface with Document and adds timestamp fields.
 */
export interface IConfigSchema extends IConfig, Document {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extends the IMember interface with Document and adds timestamp fields.
 */
export interface IMemberSchema extends Omit<IMember, "id">, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface IGuestSchema extends Omit<IGuest, "id">, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrganizerSchema extends Omit<IOrganizer, "_id">, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface IDailyManagementSchema
  extends Omit<IDailyManagement, "id">,
    Document {}

export interface IDepartmentSchema extends Omit<IDepartment, "id">, Document {}

/**
 * Extends the IAddress interface with Document.
 */
export interface IAddressSchema extends IAddress, Document {}

/**
 * Extends the IPayment interface with Document.
 */
export interface IPaymentSchema extends IPayment, Document {}

export interface IJobSchema extends Omit<IJob, "_id">, Document {
  createdAt: Date;
  updatedAt: Date;
}
export interface IReqruitmentSchema
  extends Omit<IReqruitment, "_id">,
    Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface IAgendaConfigurationSchema
  extends Omit<IAgendaConfiguration, "_id">,
    Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface IParticipantConfigurationSchema
  extends Omit<IAgendaParticipantConfiguration, "_id">,
    Document {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extends the IParticipant interface with Document.
 */
export interface IParticipantSchema
  extends Omit<IParticipant, "_id">,
    Document {}

export interface ICommitteeConfigurationSchema
  extends Omit<IAgendaCommitteeConfiguration, "_id">,
    Document {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extends the ICommittee interface with Document.
 */
export interface ICommitteeSchema extends Omit<ICommittee, "_id">, Document {}

/**
 * Extends the IEvent interface with Document and adds timestamp fields.
 */
export interface IAgendaSchema extends Omit<IAgenda, "_id">, Document {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extends the IContributor interface with Document.
 */
export interface IContributorSchema extends IContributor, Document {}

/**
 * Extends the IProject interface with Document and adds timestamp fields.
 */
export interface IProjectSchema extends Omit<IProject, "_id">, Document {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extends the INews interface with Document.
 */
export interface INewsSchema extends Omit<INews, "_id">, Document {
  findRelated: (limit?: number) => Promise<INews[]>;
}

export interface IPhotoSchema extends Omit<IPhoto, "_id">, Document {
  createdAt: Date;
  updatedAt: Date;
}
export interface IVideoSchema extends Omit<IVideo, "_id">, Document {
  createdAt: Date;
  updatedAt: Date;
}
export interface IRequestSignSchema
  extends Omit<IRequestSign, "_id">,
    Document {
  createdAt: Date;
  updatedAt: Date;
}
export interface ITrailSchema extends Omit<ITrail, "_id">, Document {}
export interface IDocSchema extends Omit<IDoc, "_id">, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommentSchema extends Omit<IComment, "_id">, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface IAspirationSchema extends Omit<IAspiration, "_id">, Document {
  createdAt: Date;
  updatedAt: Date;
  photos: IPhoto[];
  videos: IVideo[];
  docs: IDoc[];
}
export interface IMessageSchema extends Omit<IMessage, "_id">, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface IOTPSchema extends Omit<IOTP, "_id">, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategorySchema extends Omit<ICategory, "_id">, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface IAnswerSchema extends Document, Omit<IAnswer, "_id"> {
  createdAt: Date;
  updatedAt: Date;
}
export interface IQuestionSchema extends Document, Omit<IQuestion, "_id"> {
  createdAt: Date;
  updatedAt: Date;
}
export interface IOptionSchema extends Document, Omit<IOption, "_id"> {}
