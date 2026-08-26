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
    "/api/refresh",
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
    /^\/api\/category$/,
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

  // Guest capability routes (POST): anonymous visitors complete a
  // registration using the registration ObjectId embedded in their email
  // link / ticket URL. Handlers enforce guest-ownership and eligibility —
  // these paths must NEVER be widened beyond the exact patterns below.
  const guestCapabilityPatterns: RegExp[] = [
    /^\/api\/agenda\/[0-9a-f]{24}\/participant\/register$/i,
    /^\/api\/agenda\/[0-9a-f]{24}\/participant\/register\/[0-9a-f]{24}\/payment$/i,
    /^\/api\/agenda\/[0-9a-f]{24}\/participant\/register\/[0-9a-f]{24}\/question\/answer$/i,
    /^\/api\/agenda\/[0-9a-f]{24}\/participant\/question\/answer\/[0-9a-f]{24}$/i,
    /^\/api\/agenda\/[0-9a-f]{24}\/participant\/[0-9a-f]{24}\/verify$/i,
    /^\/api\/agenda\/[0-9a-f]{24}\/payment\/[0-9a-f]{24}\/proof$/i,
  ];
  const isGuestCapabilityRoute =
    event.method === "POST" &&
    guestCapabilityPatterns.some(re => re.test(path));

  if (isWhitelisted || isGetWhitelisted || isGuestCapabilityRoute) {
    if (checkAuth(event)) {
      try {
        event.context.user = await ensureAuth(event);
        event.context.organizer = event.context.user?.member?.organizer;
      } catch (error) {
        // Safe to ignore for public/guest-capability endpoints — anonymous
        // access is expected here and handlers enforce their own rules.
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
