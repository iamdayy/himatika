import { UserModel } from "~~/server/models/UserModel";
import { validatePassword } from "~~/server/utils/validatePassword";

export default defineEventHandler(async (event) => {
  const { newPassword, newPasswordConfirmation, oldPassword } = await readBody(
    event
  );
  const usr = event.context.user;
  if (!usr) {
    throw createError({
      statusCode: 401,
      statusMessage: "Tidak Diizinkan",
      data: { message: "Tidak Diizinkan" },
    });
  }
  const user = await UserModel.findOne({ username: usr.username });
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "Tidak Ditemukan",
      data: { message: "Pengguna tidak ditemukan" },
    });
  }
  const passwordMatch = await user.verifyPassword(oldPassword, user.password);
  if (passwordMatch) {
    if (newPassword !== newPasswordConfirmation) {
      throw createError({
        statusCode: 400,
        statusMessage: "Permintaan Buruk",
        data: {
          message: "Konfirmasi kata sandi tidak cocok",
          path: "password_confirmation",
        },
      });
    }
    if (newPassword === oldPassword) {
      throw createError({
        statusCode: 400,
        statusMessage: "Permintaan Buruk",
        data: {
          message: "Kata sandi baru tidak boleh sama dengan kata sandi lama",
          path: "password",
        },
      });
    }

    validatePassword(newPassword);

    user.password = newPassword;
    await user.save();
    return {
      statusCode: 200,
      statusMessage: "Kata sandi berhasil diperbarui",
    };
  } else {
    throw createError({
      statusCode: 401,
      statusMessage: "Tidak Diizinkan",
      data: { message: "Kata sandi salah", path: "password" },
    });
  }
});
