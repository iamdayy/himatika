export default defineEventHandler(async (event) => {
  const path = event.path.split("?")[0];

  // Only run auth middleware for /api routes
  if (!path.startsWith("/api")) {
    return;
  }

  // Explicitly public routes (method independent or specific checks needed)
  if (
    path === "/api/refresh" ||
    path === "/api/signin" ||
    path === "/api/member/register" || // Registration is public
    path.startsWith("/api/payment/notification") // Webhooks are public
  ) {
    return;
  }

  const publicGetRoutes = [
    "/api/stats",
    "/api/config",
    "/api/news",
    "/api/agenda/nearest",
    "/api/organizer",
    "/api/aspiration", // Reading aspirations might be public? Let's check. Original code didn't have it.
    "/api/ip"
    // If not in original, let's stick to original publicRoutes list but enforce auth for others.
  ];

  // Allow GET requests to specific public endpoints
  if (
    publicGetRoutes.some((route) => path.startsWith(route)) &&
    event.method === "GET"
  ) {
     // Optional Auth: Try to load user if token exists, but don't fail if not.
     if (checkAuth(event)) {
        try {
            event.context.user = await ensureAuth(event);
            event.context.organizer = event.context.user.member.organizer;
        } catch (e) {
            // Token invalid? Treat as guest.
        }
     }
     return;
  }

  event.context.user = await ensureAuth(event);
  event.context.organizer = event.context.user.member.organizer;
});
