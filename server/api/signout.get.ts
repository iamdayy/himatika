import { killAuth } from "../utils/authHelper";
export default defineEventHandler(async (event) => {
  try {
    const data = await killAuth(event);
    return data;
  } catch (error) {
    return error;
  }
});
