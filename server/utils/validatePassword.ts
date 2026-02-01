export const validatePassword = (password: string) => {
  if (password.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: "Kata sandi harus minimal 8 karakter",
      data: { message: "Kata sandi terlalu pendek", path: "password" },
    });
  }
  if (!/[a-z]/.test(password)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Kata sandi harus mengandung setidaknya satu huruf kecil",
      data: { message: "Kurang huruf kecil", path: "password" },
    });
  }
  if (!/[A-Z]/.test(password)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Kata sandi harus mengandung setidaknya satu huruf besar",
      data: { message: "Kurang huruf besar", path: "password" },
    });
  }
  if (!/\d/.test(password)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Kata sandi harus mengandung setidaknya satu angka",
      data: { message: "Kurang angka", path: "password" },
    });
  }
  return true;
};
