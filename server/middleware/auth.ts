export default defineEventHandler(async (event) => {
  const path = event.path.split("?")[0];

  // Only run auth middleware for /api routes
  if (!path?.startsWith("/api")) {
    return;
  }

  const whitelist = [
    "/api/auth",
    "/api/signin",
    "/api/signup",
    "/api/reset-password",
    "/api/otp",
    "/api/signout",
    "/api/payment/notification",
    "/api/webhooks/qstash",
    "/api/sign/verify",
    "/api/ip"
  ];

  // Some endpoints are GET-only public
  const getOnlyWhitelist = [
    "/api/news",
    "/api/agenda",
    "/api/config",
    "/api/stats"
  ];

  const isWhitelisted = whitelist.some(w => path.startsWith(w));
  const isGetWhitelisted = getOnlyWhitelist.some(w => path.startsWith(w)) && event.method === "GET";

  if (isWhitelisted || isGetWhitelisted) {
    if (checkAuth(event)) {
      try {
        event.context.user = await ensureAuth(event);
        event.context.organizer = event.context.user?.member?.organizer;
      } catch (error) {
        // Safe to ignore for public whitelisted endpoints, they don't require valid tokens
      }
    }
    return;
  }

  // Secure by Default: Block non-whitelisted endpoints
  try {
    event.context.user = await ensureAuth(event);
    event.context.organizer = event.context.user?.member?.organizer;
  } catch (error: any) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthenticated: Token is missing or invalid",
    });
  }
});
