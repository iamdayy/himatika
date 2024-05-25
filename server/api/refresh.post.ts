export default defineEventHandler(async (event) => {
  try {
    const data = await refreshAuth(event);
    return data;
  } catch (error) {
    return error;
  }
});
