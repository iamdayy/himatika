import { Types } from "mongoose";

/**
 * Interface representing the parameters required to set a user session.
 */
export interface ISetSessionParams {
  /**
   * The authentication token for the session.
   */
  token: string;

  /**
   * The refresh token used to obtain a new authentication token when the current one expires.
   */
  refreshToken: string;

  /**
   * The MongoDB ObjectId of the user associated with this session.
   */
  user?: Types.ObjectId;
  guest?: Types.ObjectId;
}
