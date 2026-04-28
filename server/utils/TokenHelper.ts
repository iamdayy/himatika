import { createHmac, timingSafeEqual } from "crypto";

const getSecret = (): string => {
  const secretKey = useRuntimeConfig().jwtSecret;
  if (!secretKey) {
    throw new Error(
      "JWT secret key is not configured. Set the JWT_SECRET environment variable."
    );
  }
  return secretKey;
};
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
  // Use timingSafeEqual to prevent timing attacks
  return timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(calculated, "hex"));
};
