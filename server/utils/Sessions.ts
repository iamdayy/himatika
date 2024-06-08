import { H3Error } from "h3";
import jwt from "jsonwebtoken";
import { ISetSessionParams } from "~/types/IParam";
import { SessionModel } from "../models/SessionModel";
import { UserModel } from "../models/UserModel";
export const getSession = async (payload: string) => {
  try {
    const session = await SessionModel.findOne({ accessToken: payload });
    if (!session) {
      throw createError({
        statusMessage: "Unauthenticated!",
        statusCode: 401,
      });
    }
    const accessToken = jwt.verify(
      session.accessToken,
      "HimatikaUser"
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
    return user;
  } catch (error: any) {
    throw error;
  }
};
export const refreshSession = async (payload: string) => {
  const refreshToken = jwt.verify(payload, "HimatikaUser") as jwt.JwtPayload;
  if (!refreshToken) {
    throw createError({
      statusMessage: "Unauthenticated!",
      statusCode: 401,
    });
  }
  const session = await SessionModel.findOne({ token: payload });
  if (!session) {
    throw createError({
      statusMessage: "Unauthenticated!",
      statusCode: 401,
    });
  }
  const token = jwt.sign({ user: session.user }, "HimatikaUser", {
    expiresIn: "10h",
  });
  session.accessToken = token;
  session.save();

  return token;
};
export const setSession = async (
  payload: ISetSessionParams
): Promise<true | H3Error> => {
  try {
    const session = await SessionModel.findOne({ user: payload.user });
    if (!session) {
      const createdSession = await SessionModel.create(payload);
      if (createdSession) {
        throw createError({
          statusCode: 500,
          statusMessage: "Ouh error on system",
        });
      }
      return true;
    }
    session.accessToken = payload.accessToken;
    session.token = payload.token;
    const saved = await session.save();
    if (!saved) {
      throw createError({
        statusCode: 500,
        statusMessage: "Ouh error on system",
      });
    }
    return true;
  } catch (error: any) {
    return error;
  }
};
export const clearSession = async (payload: string) => {
  try {
    const session = jwt.verify(payload, "HimatikaUser") as jwt.JwtPayload;
    if (!session) {
      throw createError({
        statusMessage: "Unauthenticated!",
        statusCode: 401,
      });
    }
    const s = await SessionModel.findOne({ user: session.user });
    const deleted = s?.deleteOne();
    return deleted;
  } catch (error: any) {
    return error;
  }
};
