export default defineEventHandler(async (event) => {
  const path = event.path.split("?")[0];

  // Only run auth middleware for /api routes
  if (!path?.startsWith("/api")) {
    return;
  }

  // Skip auth middleware for signout to allow users with expired tokens to log out
  if (path === "/api/signout") {
    return;
  }

  if (checkAuth(event)) {
    try {
      event.context.user = await ensureAuth(event);
      event.context.organizer = event.context.user.member?.organizer;
    } catch (error) {
      // Ignore authentication errors at the middleware level.
      // Protected endpoints should handle authorization and throw their own errors.
    }
  }
});
