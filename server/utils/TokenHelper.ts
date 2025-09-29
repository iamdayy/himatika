import bcrypt from "bcryptjs";
/**
 * Generate a token
 * @param email
 * @param otp
 * @param type
 * @return string
 * @throws Error
 */
export const generateToken = async (
  email: string,
  otp: string,
  type: string
) => {
  const string = `${email}${otp}${type}`;
  const salt = await bcrypt.genSalt(10);
  const token = await bcrypt.hash(string, salt);
  return token;
};

/**
 *  Verify the token
 *
 * @param token
 * @param email
 * @param otp
 * @param type
 * @return boolean
 * @throws Error
 */
export const verifyToken = async (
  token: string,
  email: string,
  otp: string,
  type: string
) => {
  const string = `${email}${otp}${type}`;
  const result = await bcrypt.compare(string, token);
  return result;
};
