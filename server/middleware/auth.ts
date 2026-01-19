export default defineEventHandler(async (event) => {
  const path = event.path.split("?")[0];

  // Only run auth middleware for /api routes
  if (!path.startsWith("/api")) {
    return;
  }
  console.log("Auth middleware running for path:", path);
  console.log("Auth status", checkAuth(event))

  if (checkAuth(event)) {
    event.context.user = await ensureAuth(event);
    event.context.organizer = event.context.user.member.organizer;
  }
});
