import { createHmac } from "crypto";

const getSecret = () => useRuntimeConfig().jwtSecret || "fallback-secret";
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
  const data = `${email}${otp}${type}`;
  // HMAC SHA256 jauh lebih cepat dan tidak memblokir CPU
  return createHmac("sha256", getSecret()).update(data).digest("hex");
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
  const data = `${email}${otp}${type}`;
  const calculated = createHmac("sha256", getSecret())
    .update(data)
    .digest("hex");
  // Gunakan timingSafeEqual untuk mencegah timing attacks (opsional tapi bagus)
  return token === calculated;
};
