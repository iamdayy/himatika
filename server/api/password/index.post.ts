import { UserModel } from "~~/server/models/UserModel";

export default defineEventHandler(async (event) => {
  const { newPassword, newPasswordConfirmation, oldPassword } = await readBody(
    event
  );
  const usr = event.context.user;
  if (!usr) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      data: { message: "Unauthorized" },
    });
  }
  const user = await UserModel.findOne({ username: usr.username });
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      data: { message: "User not found" },
    });
  }
  const passwordMatch = await user.verifyPassword(oldPassword, user.password);
  if (passwordMatch) {
    if (newPassword !== newPasswordConfirmation) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          message: "Password confirmation does not match",
          path: "password_confirmation",
        },
      });
    }
    if (newPassword === oldPassword) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          message: "New password cannot be the same as the old password",
          path: "password",
        },
      });
    }
    user.password = newPassword;
    await user.save();
    return {
      statusCode: 200,
      statusMessage: "Password updated successfully",
    };
  } else {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      data: { message: "Incorrect password", path: "password" },
    });
  }
});
