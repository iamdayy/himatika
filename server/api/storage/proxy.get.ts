/**
 * CORS workaround proxy for fetching R2-hosted PDFs from the browser.
 * SSRF protection: only https URLs on trusted origins (the configured object
 * storage / app public hosts) may be proxied.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const url = query.url as string;

  if (!url) {
    throw createError({
      statusCode: 400,
      statusMessage: "URL is required",
    });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid URL",
    });
  }

  const config = useRuntimeConfig(event);
  const allowedHosts = new Set<string>();
  for (const candidate of [
    config.r2_public_domain,
    config.storageDir,
    config.public.public_uri,
  ]) {
    if (!candidate) continue;
    try {
      allowedHosts.add(new URL(candidate).host);
    } catch {
      // Value without a scheme (e.g. "pub-xyz.r2.dev") — treat as a bare host
      allowedHosts.add(String(candidate));
    }
  }

  const isProd = process.env.NODE_ENV === "production";
  const protocolAllowed = parsed.protocol === "https:" || (!isProd && parsed.protocol === "http:");
  const hostAllowed = allowedHosts.has(parsed.host);

  if (!protocolAllowed || !hostAllowed) {
    throw createError({
      statusCode: 403,
      statusMessage: "URL is not allowed to be proxied",
    });
  }

  return proxyRequest(event, url);
});
