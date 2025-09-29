export default defineEventHandler(async (event) => {
  if (event.path === "/api/refresh" || event.path === "/api/signin") {
    return;
  }
  const isAuthenticated = checkAuth(event);

  if (isAuthenticated) {
    event.context.user = await ensureAuth(event);
    event.context.organizer = event.context.user.member.organizer;
  }
});
