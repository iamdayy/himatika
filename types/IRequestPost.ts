import type { SortOrder } from "mongoose";
import type {
  IAgenda,
  IAspiration,
  IDoc,
  IFile,
  IGuest,
  IMember,
  IMessage,
  INews,
  IPaymentMethod,
  IPhoto,
  IVideo,
  TAction
} from ".";

/**
 * Interface for pagination query parameters.
 */
interface IReqQueryPaginate {
  /** Number of items per page. */
  perPage: number;
  /** Current page number. */
  page: number;
}

/**
 * Interface for user registration request.
 */
export interface IReqRegister {
  /** User's chosen username. */
  username: string;
  /** User's NIM (Nomor Induk Mahasiswa). */
  NIM: number;
  email: string;
  /** User's chosen password. */
  password: string;
  /** Confirmation of the user's password. */
  password_confirmation: string;
}

/**
 * Interface for user login request.
 */
export interface IReqLogin {
  /** User's username. */
  username: string;
  /** User's password. */
  password: string;
}

/**
 * Interface for authentication request, combining registration and login.
 */
export interface IReqAuth extends IReqRegister, IReqLogin {
  /** Confirmation of the user's password. */
  password_confirmation: string;
}

/**
 * Interface for member query parameters, extending pagination.
 */
export interface IReqMemberQuery extends IReqQueryPaginate {
  /** User's NIM for filtering. */
  NIM: number;
  /** Search term for filtering members. */
  search: string;
  /** Field to sort the results by. */
  sort: "enteredYear" | "class" | "semester" | "fullName" | "createdAt";
  /** Sort order (ascending or descending). */
  order: SortOrder;
  /** User's email for filtering. */
  email: string;
  /** Field to filter the results by. */
  filterBy: "enteredYear" | "class" | "semester";
  /** Value to filter by. */
  filter: string;
  /** Whether to include deleted members. */
  deleted: "false" | "true";
}

/**
 * Interface for member request, extending IMember.
 */
export interface IReqMember extends IMember {}

export interface IReqMemberBatch {
  /** Array of member data to be processed in batch. */
  members: number[];
  /** Field to update in the batch operation. */
  field: "status" | "class" | "semester" | "enteredYear";
  /** New value for the specified field. */
  value: string | number;
}

/**
 * Interface for member avatar request, extending IMember.
 */
export interface IReqMemberAvatar {
  avatar: IFile;
}

export interface IReqCategoryQuery extends IReqQueryPaginate {
  /** Field to sort the results by. */
  sort: string;
  /** Sort order. */
  order: string;
  /** Category slug for filtering. */
  slug: string;
  /** Search term for filtering categories. */
  search: string;
}
/**
 * Interface for event request, extending IEvent.
 */
export interface IReqAgenda extends IAgenda {
  enableSubscription: boolean;
}
export interface IReqAgendaRegister {
  guest?: IGuest;
  job?: string;
}

export interface IReqAgendaQuery extends IReqQueryPaginate {
  /** Field to sort the results by. */
  sort: string;
  /** Sort order. */
  order: string;
  id: string;
  search: string;
  showMissed: string;
  status?: string;
  category: string;
  tags: string[];
}

export interface IReqAgendaParticipantQuery extends IReqQueryPaginate {
  /** Field to sort the results by. */
  sort: string;
  /** Sort order. */
  order: string;
  id: string;
  search: string;
  status?: string;
}
export interface IReqParticipantBatch {
  participants: string[];
  field: "payment" | "visiting";
}
export interface IReqAgendaCommitteeQuery extends IReqQueryPaginate {
  /** Field to sort the results by. */
  sort: string;
  /** Sort order. */
  order: string;
  id: string;
  search: string;
  status?: string;
}
export interface IReqCommitteeBatch {
  committees: string[];
  field: "payment" | "visiting";
}
export interface IPaymentBody {
  payment_method: IPaymentMethod;
  bank_transfer?: string;
  credit_card?: {
    token_id: string;
  };
}
export interface IReqPaymentQuery {
  transaction_id: string;
}

export interface IPayReq {
  paymentMethod: IPaymentMethod;
}
export interface IReqAgendaPhoto {
  photo: IPhoto;
}

export interface IReqAgendaVideo {
  video: IVideo;
}
export interface IReqAgendaDoc {
  doc: IDoc;
  label: string;
}

/**
 * Interface for project query parameters, extending pagination.
 */
export interface IReqProjectQuery extends IReqQueryPaginate {
  /** Project ID for filtering. */
  id: string;

  /** Show missed project */
  notPublished: string;
  /** Field to sort the results by. */
  sort: string;
  /** Sort order. */
  order: SortOrder;
  tags: string;
  category: string;
  search: string;
}
export interface IReqProjectPhoto {
  photo: IPhoto;
}

/**
 * Interface for news query parameters, extending pagination.
 */
export interface IReqNewsQuery extends IReqQueryPaginate {
  /** Field to sort the results by. */
  sort: string;
  /** Sort order. */
  order: string;
  /** News slug for filtering. */
  slug: string;
  /** Category for filtering. */
  category: string;
  /** Tags for filtering. */
  tags: string;
  /** Search term for filtering news. */
  search: string;
  notPublished: string;
  archived: string;
}

/**
 * Interface for news request, extending INews.
 */
export interface IReqNews extends INews {}

export interface IReqQuestionQuery extends IReqQueryPaginate {
  /** Field to sort the results by. */
  sort: string;
  /** Sort order. */
  order: string;
  /** Question ID for filtering. */
  id: string;
  /** Tags for filtering. */
  tags: string[];
  /** Search term for filtering questions. */
  search: string;
  // /** Whether to filter by answered questions. */
  // answered: string;
  // /** Whether to filter by unanswered questions. */
  // unanswered: string;
}
export interface IReqPhotoQuery extends IReqQueryPaginate {
  /** Field to sort the results by. */
  sort: string;
  /** Sort order. */
  order: string;
  /** Photo ID for filtering. */
  id: string;
  /** Active for filtering. */
  showInCarrousel: string;
  /** Search term for filtering photos. */
  search: string;
  /** Tags for filtering. */
  tags: string;
}
export interface IReqVideoQuery extends IReqQueryPaginate {
  /** Field to sort the results by. */
  sort: string;
  /** Sort order. */
  order: string;
  /** Photo ID for filtering. */
  id: string;
  /** Search term for filtering photos. */
  search: string;
  /** Tags for filtering. */
  tags: string;
}
export interface IReqDocQuery extends IReqQueryPaginate {
  /** Field to sort the results by. */
  sort: string;
  /** Sort order. */
  order: string;
  /** Photo ID for filtering. */
  id: string;
  /** Search term for filtering photos. */
  search: string;
  /** Tags for filtering. */
  tags: string;
  /** Signed filter. */
  signed: boolean;
}

export interface IReqPhoto extends IPhoto {}
export interface IReqVideo extends IVideo {}
export interface IReqDoc extends IDoc {
  action?: TAction;
  signature?: string;
}

export interface IReqAspirationVideo {
  video: IVideo;
}
export interface IReqAspirationPhoto {
  photo: IPhoto;
}

export interface IReqAspirationDoc extends IDoc {
  label: string;
}
export interface IReqAspirationQuery extends IReqQueryPaginate {
  /** Field to sort the results by. */
  sort: string;
  /** Sort order. */
  order: string;
  /** Aspiration ID for filtering. */
  id: string;
  /** Search term for filtering aspiration. */
  search: string;
  /** Whether to filter by deleted aspiration. */
  deleted: string;
  /** Filter by subject. */
  filterBy: string;
  /** Value to filter by. */
  filter: string;
}

export interface IReqAspiration extends IAspiration {}
export interface IReqMessageQuery extends IReqQueryPaginate {
  /** Field to sort the results by. */
  sort: string;
  /** Sort order. */
  order: string;
  /** Aspiration ID for filtering. */
  id: string;
  /** Search term for filtering aspiration. */
  search: string;
  /** Whether to filter by deleted aspiration. */
  deleted: string;
  /** Filter by subject. */
  filterBy: string;
  /** Value to filter by. */
  filter: string;
}

export interface IReqMessage extends IMessage {}

export interface IReqGenerateOTP {
  NIM: number;
  email: string;
  type:
    | "Verify Account"
    | "Change Password"
    | "Reset Password"
    | "Change Email"
    | "Change Phone"
    | "Verify Email"
    | "Verify Phone";
  link: string;
}
export interface IReqVerifyOTP {
  email: string;
  code: string;
  type:
    | "Verify Account"
    | "Change Password"
    | "Reset Password"
    | "Change Email"
    | "Change Phone"
    | "Verify Email"
    | "Verify Phone";
}

export interface IReqAnswer {
  answers: {
    questionId: string;
    answer: any;
  }[];
}

export interface IReqEncryption {
  title: string;
  tag: string;
}

export interface IReqSignDocument {
  encryption: string;
  docId: string;
  data: string;
}
