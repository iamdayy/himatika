import { logAction } from "~~/server/utils/logger";
import { killAuth } from "../utils/authHelper";

/**
 * Handles GET requests for user sign-out.
 *
 * This endpoint attempts to terminate the user's authentication session.
 * If successful, it returns the result of the sign-out process.
 * If an error occurs during the sign-out process, it returns the error.
 *
 * @param {H3Event} event - The H3 event object containing request details.
 * @returns {Promise<Object>} A promise that resolves to either the sign-out result or an error object.
 */
export default defineEventHandler(async (event) => {
  try {
    // Attempt to terminate the authentication session
    const data = await killAuth(event);
    
    // Audit Log: Logout
    logAction({ action: 'LOGOUT', event, target: 'Auth' });

    return {
      statusCode: 200,
      statusMessage: "Sign-out successful",
      data,
    };
  } catch (error) {
    // If an error occurs during sign-out, return the error
    return error;
  }
});
