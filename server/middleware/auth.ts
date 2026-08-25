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

  // GET-only whitelist. NOTE: entries are prefix-matched, so each pattern must
  // be scoped as tightly as possible — a broad prefix silently publishes every
  // GET handler in that subtree to anonymous callers.
  const getOnlyWhitelistPatterns: RegExp[] = [
    /^\/api\/news(?:\/|$)/,
    /^\/api\/config/,
    /^\/api\/stats(?:\/|$)/,
    /^\/api\/payment(?:\/|$)/,
    // Agenda: only intentionally-public leaf handlers.
    // Everything deeper (participant lists, registered records, payment
    // verification queues, Zoom redirects, ...) requires authentication.
    /^\/api\/agenda$/,
    /^\/api\/agenda\/tags$/,
    /^\/api\/agenda\/[0-9a-f]{24}$/i,
    /^\/api\/agenda\/[0-9a-f]{24}\/committee$/i,
    // Capability-scoped: guests complete registration without a session,
    // access is bounded to their own registration record / answers.
    /^\/api\/agenda\/[0-9a-f]{24}\/participant\/me$/i,
    /^\/api\/agenda\/[0-9a-f]{24}\/participant\/question\/answer\/[0-9a-f]{24}$/i,
  ];

  const isWhitelisted = whitelist.some(w => path.startsWith(w));
  const isGetWhitelisted =
    event.method === "GET" && getOnlyWhitelistPatterns.some(re => re.test(path));

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
