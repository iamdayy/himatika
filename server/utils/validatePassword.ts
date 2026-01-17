export const validatePassword = (password: string) => {
  if (password.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: "Password must be at least 8 characters long",
      data: { message: "Password too short", path: "password" },
    });
  }
  if (!/[a-z]/.test(password)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Password must contain at least one lowercase letter",
      data: { message: "Missing lowercase letter", path: "password" },
    });
  }
  if (!/[A-Z]/.test(password)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Password must contain at least one uppercase letter",
      data: { message: "Missing uppercase letter", path: "password" },
    });
  }
  if (!/\d/.test(password)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Password must contain at least one number",
      data: { message: "Missing number", path: "password" },
    });
  }
  return true;
};
