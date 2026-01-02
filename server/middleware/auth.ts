export default defineEventHandler(async (event) => {
  if (event.path === "/api/refresh" || event.path === "/api/signin") {
    return;
  }
  const publicRoutes = [
    "/api/stats",
    "/api/config",
    "/api/news",
    "/api/agenda/nearest",
    "/api/organizer",
    "/api/refresh",
    "/api/signin",
  ];

  // Jangan biarkan logic auth berjalan sama sekali.
  if (
    publicRoutes.some((route) => event.path === route) &&
    event.method === "GET"
  ) {
    return;
  }
  const isAuthenticated = checkAuth(event);

  if (isAuthenticated) {
    event.context.user = await ensureAuth(event);
    event.context.organizer = event.context.user.member.organizer;
  }
});
