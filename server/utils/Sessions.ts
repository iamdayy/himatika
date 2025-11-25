import { H3Error } from "h3";
import jwt from "jsonwebtoken";
import { ISetSessionParams } from "~~/types/IParam";
import { SessionModel } from "../models/SessionModel";
import { UserModel } from "../models/UserModel";

const getSecretKey = () => {
  const secretKey = useRuntimeConfig().jwtSecret;
  if (!secretKey) {
    throw new Error("JWT secret key is not configured.");
  }
  return secretKey;
};

/**
 * Checks the validity of a session token.
 * @param payload - The session token to verify.
 * @returns The user associated with the session.
 * @throws {H3Error} If the session is invalid or the user is not found.
 */
export const checkSession = async (payload: string) => {
  try {
    const session = await SessionModel.findOne({ token: payload });

    if (!session) {
      throw createError({
        statusMessage: "Unauthenticated!",
        statusCode: 401,
      });
    }

    const accessToken = jwt.verify(
      session.token,
      getSecretKey()
    ) as jwt.JwtPayload;

    if (!accessToken) {
      throw createError({
        statusMessage: "Unauthenticated!",
        statusCode: 401,
      });
    }

    const user = await UserModel.findById(session.user);
    if (!user) {
      throw createError({
        statusMessage: "Unauthenticated!",
        statusCode: 401,
      });
    }


    return {
      username: user.username,
      member: {
        _id: user.member.id,
        NIM: user.member.NIM,
        fullName: user.member.fullName,
        avatar: user.member.avatar,
        email: user.member.email,
        birth: user.member.birth,
        religion: user.member.religion,
        sex: user.member.sex,
        citizen: user.member.citizen,
        address: user.member.address,
        phone: user.member.phone,
        class: user.member.class,
        semester: user.member.semester,
        point: user.member.point,
        enteredYear: user.member.enteredYear,
        status: user.member.status,
        agendas: user.member.agendas,
        projects: user.member.projects,
        organizer: user.member.organizer,
        aspirations: user.member.aspirations,
        documents: user.member.documents,
        docsRequestSign: user.member.docsRequestSign,
      },
    };
  } catch (error: any) {
    throw error;
  }
};

/**
 * Refreshes a session by generating a new token.
 * @param payload - The refresh token.
 * @returns The new session token.
 * @throws {H3Error} If the refresh token is invalid or the session is not found.
 */
export const refreshSession = async (payload: string) => {
  const refreshToken = jwt.verify(payload, getSecretKey()) as jwt.JwtPayload;

  if (!refreshToken) {
    throw createError({
      statusMessage: "Unauthenticated!",
      statusCode: 401,
    });
  }

  const session = await SessionModel.findOne({ refreshToken: payload });

  if (!session) {
    throw createError({
      statusMessage: "Unauthenticated!",
      statusCode: 401,
    });
  }

  const token = jwt.sign({ user: session.user }, getSecretKey(), {
    expiresIn: "10h",
  });
  session.token = token;
  await session.save();

  return token;
};

/**
 * Creates or updates a session for a user.
 * @param payload - The session parameters.
 * @returns True if the session was successfully set, or an H3Error if an error occurred.
 */
export const setSession = async (
  payload: ISetSessionParams
): Promise<true | H3Error> => {
  try {
    const createdSession = await SessionModel.create(payload);
    if (!createdSession) {
      throw createError({
        statusCode: 500,
        statusMessage: "Error creating session",
      });
    }
    return true;
  } catch (error: any) {
    return error;
  }
};

/**
 * Terminates a user's session.
 * @param payload - The session token to terminate.
 * @returns The result of the session deletion operation.
 * @throws {H3Error} If the session token is invalid.
 */
export const exitSession = async (payload: string) => {
  try {
    const session = jwt.verify(payload, getSecretKey()) as jwt.JwtPayload;
    if (!session) {
      throw createError({
        statusMessage: "Unauthenticated!",
        statusCode: 401,
      });
    }
    const s = await SessionModel.findOne({ user: session.user });
    const deleted = await s?.deleteOne();
    return deleted;
  } catch (error: any) {
    return error;
  }
};
