import type {
  IAgenda,
  IAspiration,
  ICategory,
  ICommittee,
  IConfig,
  IDoc,
  IDocGrouped,
  IEncryption,
  IMember,
  IMessage,
  INews,
  IOrganizer,
  IParticipant,
  IPayment,
  IPhoto,
  IPhotoGrouped,
  IProject,
  IQuestion,
  IUser,
  IVideoGrouped,
} from ".";

export interface IResponse {
  statusCode: number;
  statusMessage: string;
}

/**
 * Interface representing an error response.
 */
export interface IError extends IResponse {
  /** The data of the error. */
  data?: any;
}

/**
 * Interface representing the response for a user registration.
 * Extends the IUser interface to include all user information.
 */
export interface IRegisterResponse {
  /** The status code of the response. */
  statusCode: number;
  /** The status message of the response. */
  statusMessage: string;
  /** The data of the response. */
  data: IUser;
}

export interface IErrorRegisterResponse extends IError {}

export interface IAgendaResponse extends IResponse {
  /** An array of agendas matching the query. */
  data?: {
    agendas?: IAgenda[];
    agenda?: IAgenda;
    length?: number;
  };
}

export interface IAgendaRegisterResponse extends IResponse {
  data?: {
    participantId: string;
  };
}

export interface IParticipantResponse extends IResponse {
  data?: {
    participant: IParticipant;
  };
}
export interface ICommitteeResponse extends IResponse {
  data?: {
    committee: ICommittee;
  };
}

export interface IAgendaParticipantResponse extends IResponse {
  data?: {
    agenda: IAgenda;
    participants?: IParticipant[];
    length: number;
  };
}
export interface IAgendaCommitteeResponse extends IResponse {
  data?: {
    agenda: IAgenda;
    committees?: ICommittee[];
    length: number;
  };
}
export interface IPaymentResponse extends IResponse {
  data: {
    payment: IPayment;
  };
}
export interface IAgendaMeResponse extends IResponse {
  /** An array of agendas matching the query. */
  data?: {
    agendas?: {
      participant?: IAgenda[];
      committee?: IAgenda[];
    };
    length?: number;
  };
}

export interface IAgendaRegisteredResponse extends IResponse {
  as: "committee" | "participant";
  data?: ICommittee | IParticipant;
}
export interface IVoteResponse extends IResponse {
  totalVotes?: number;
}

export interface IConfigResponse extends IResponse {
  data: IConfig;
}

export interface IStatsResponse extends IResponse {
  data?: {
    projects: number;
    members: number;
    agenda: number;
  };
}

export interface IPointResponse extends IResponse {
  data?: {
    points: {
      avatar?: string;
      fullName: string;
      NIM: number;
      semester?: number;
      point?: { point: number }[];
      no: number;
      class: string;
    }[];
  };
}

export interface IOrganizerResponse extends IResponse {
  data?: {
    organizers?: IOrganizer[];
    organizer?: IOrganizer;
  };
}

export interface IPhotoResponse extends IResponse {
  data?: {
    data: IPhotoGrouped[];
    length: number;
  };
}

export interface IVideoResponse extends IResponse {
  data?: {
    data: IVideoGrouped[];
    length: number;
  };
}
export interface IDocResponse extends IResponse {
  data?: {
    data?: IDocGrouped[];
    doc?: IDoc | IDoc[];
    length: number;
    signedByMe?: boolean;
  };
}

export interface IActivinessLetterResponse extends IResponse {
  data?: IDoc[];
}

export interface ICarrouselResponse extends IResponse {
  data?: {
    photos: IPhoto[];
    length: number;
  };
}

/**
 * Interface representing the response for a project query.
 * Extends IPaginateResponse to include pagination information.
 */
export interface IProjectsResponse extends IResponse {
  /** An array of projects matching the query. */
  data?: {
    project?: IProject;
    projects?: IProject[];
    length?: number;
  };
}

export interface IProjectMeResponse extends IResponse {
  /** An array of projects matching the query. */
  data?: {
    projects?: IProject[];
    length?: number;
  };
}

/**
 * Interface representing the response for a member query.
 * Extends IPaginateResponse to include pagination information.
 */
export interface IMemberResponse extends IResponse {
  data?: {
    /** An array of available filter options. */
    filters?: string[] | number[];
    /** An array of members matching the query. */
    members?: IMember[];
    length?: number;
    member?: IMember;
  };
}

/**
 * Interface representing the response for a news query.
 * Extends IPaginateResponse to include pagination information.
 */
export interface INewsResponse extends IResponse {
  /** An array of newss matching the query. */
  data?: {
    news?: (INews & { related?: INews[] }) | INews[];
    length: number;
  };
}

export interface ICategoriesResponse extends IResponse {
  data?: {
    categories?: ICategory[];
    category?: ICategory;
    length: number;
  };
}

export interface ITagsResponse extends IResponse {
  data?: {
    tags: string[];
    length: number;
  };
}

export interface IAspirationResponse extends IResponse {
  data?: {
    aspirations?: IAspiration[];
    aspiration?: IAspiration;
    length?: number;
    voted?: boolean;
    voteType?: "upvote" | "downvote";
    isMine?: boolean;
  };
}
export interface IAspirationMeResponse extends IResponse {
  data?: {
    aspiration: IAspiration[];
    length: number;
  };
}
export interface IMessageResponse extends IResponse {
  data?: {
    messages: IMessage[];
    length: number;
  };
}

export interface IExportSheetResponse extends IResponse {
  data?: {
    url: string;
    title: string;
  };
}

export interface IGenerateOTPResponse extends IResponse {
  data?: {
    expiresAt: string;
    email: string;
  };
}

export interface IVerifyOTPResponse extends IResponse {
  data?: {
    token: string;
    type:
      | "Verify Account"
      | "Change Password"
      | "Reset Password"
      | "Change Email"
      | "Change Phone"
      | "Verify Email"
      | "Verify Phone";
  };
}

export interface IDocsMeResponse extends IResponse {
  data?: {
    docs: IDoc[];
    length: number;
  };
}

export interface IAnswersResponse extends IResponse {
  data?: {
    answers: {
      question: IQuestion;
      answer: string;
    }[];
  };
}

export interface IEncryptionsResponse extends IResponse {
  data?: {
    encryptions?: Omit<IEncryption, "private_key">[];
    count?: number;
    encryption?: Omit<IEncryption, "_id">;
  };
}
