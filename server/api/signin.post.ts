import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { UserModel } from "~/server/models/UserModel";
import { setSession } from "../utils/Sessions";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const user = await UserModel.findOne({ username: body.username });
  if (!user) {
    throw createError({
      statusCode: 401,
      message: "User not found",
    });
  }
  const passMatch = await user?.verifyPassword(body.password, user.password);
  if (!passMatch) {
    throw createError({
      statusCode: 401,
      message: "Please check your password",
    });
  }
  const accessToken = jwt.sign({ user: user._id }, "HimatikaUser", {
    expiresIn: "10h",
  });
  const refreshToken = jwt.sign({ user: user._id }, "HimatikaUser", {
    expiresIn: "1w",
  });
  await setSession({
    accessToken,
    token: refreshToken,
    user: user._id as Types.ObjectId,
  });
  user.save();
  return {
    accessToken,
    refreshToken,
  };
});
