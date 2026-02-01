import { H3Event } from "h3";
import { checkSession, exitSession, refreshSession } from "./Sessions";

/**
 * The type of token used for authentication.
 */
const TOKEN_TYPE = "Bearer";

/**
 * Extracts the token from the Authorization header value.
 * @param authHeaderValue - The value of the Authorization header.
 * @returns The extracted token.
 */
const extractToken = (authHeaderValue: string) => {
  const [, token] = authHeaderValue.split(`${TOKEN_TYPE} `);
  return token;
};

/**
 * Checks if the Authorization header is present in the request.
 * @param event - The H3Event object representing the HTTP request.
 * @returns A boolean indicating whether the Authorization header is present.
 */
export const checkAuth = (event: H3Event) => {
  const authHeaderValue = getRequestHeader(event, "Authorization");
  return typeof authHeaderValue !== "undefined";
};

/**
 * Ensures that the request is authenticated and returns the session information.
 * @param event - The H3Event object representing the HTTP request.
 * @returns A Promise that resolves to the session information.
 * @throws An error if authentication fails.
 */
export const ensureAuth = async (event: H3Event) => {
  const authHeaderValue = getRequestHeader(event, "Authorization");

  if (typeof authHeaderValue === "undefined") {
    throw createError({
      statusCode: 401,
      statusMessage:
        "Perlu menyertakan header Authorization Bearer yang valid untuk mengakses endpoint ini",
    });
  }

  const extractedToken = extractToken(authHeaderValue);
  try {
    return await checkSession(extractedToken);
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: "Anda harus login untuk menggunakan endpoint ini",
    });
  }
};

/**
 * Refreshes the authentication token.
 * @param event - The H3Event object representing the HTTP request.
 * @returns A Promise that resolves to an object containing the new token and refresh token.
 * @throws An error if the refresh process fails.
 */
export const refreshAuth = async (event: H3Event) => {
  try {
    const { refreshToken } = await readBody(event);

    if (typeof refreshToken === "undefined") {
      throw createError({
        statusCode: 401,
        statusMessage:
          "Perlu menyertakan header Authorization Bearer yang valid untuk mengakses endpoint ini",
      });
    }
    const token = await refreshSession(refreshToken);

    return token;
  } catch (error: any) {
    throw createError({
      statusCode: 401,
      statusMessage:
        error.statusMessage || "Anda harus login untuk menggunakan endpoint ini",
    });
  }
};

/**
 * Terminates the current session.
 * @param event - The H3Event object representing the HTTP request.
 * @returns A Promise that resolves when the session is successfully terminated.
 * @throws An error if the session termination fails.
 */
export const killAuth = async (event: H3Event) => {
  const authHeaderValue = getRequestHeader(event, "Authorization");
  if (typeof authHeaderValue === "undefined") {
    throw createError({
      statusCode: 401,
      statusMessage:
        "Perlu menyertakan header Authorization Bearer yang valid untuk mengakses endpoint ini",
    });
  }

  const extractedToken = extractToken(authHeaderValue);
  try {
    return await exitSession(extractedToken);
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: "Anda harus login untuk menggunakan endpoint ini",
    });
  }
};
