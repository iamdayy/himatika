export default defineEventHandler((event) => {
  const userIp =
    event.req.headers["x-forwarded-for"] || event.req.connection.remoteAddress;
  return userIp;
});
