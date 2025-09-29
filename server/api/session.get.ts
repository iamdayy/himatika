import { ensureAuth } from "../utils/authHelper";

/**
 * API endpoint to get the current user session
 *
 * This handler attempts to authenticate the user and return their session information.
 * If authentication fails, it returns the error instead.
 *
 * @param {H3Event} event - The H3 event object containing request details
 * @returns {Promise<User|Error>} A promise that resolves to the authenticated user or an error
 */
export default defineEventHandler(async (event) => {
  try {
    // Attempt to authenticate the user
    const user = await ensureAuth(event);

    // If successful, return the user object
    return user;
  } catch (error) {
    // If authentication fails, return the error
    return error;
  }
});
