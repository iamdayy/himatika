import { ensureAuth } from "../utils/authHelper";

export default defineEventHandler(async (event) => {
  try {
    const user = await ensureAuth(event);
    return user;
  } catch (error) {
    return error;
  }
});
