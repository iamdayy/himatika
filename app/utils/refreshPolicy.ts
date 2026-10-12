/**
 * Refresh-failure policy for the authenticated API client.
 *
 * Pure helpers (no Nuxt dependencies) so the "when do we log out vs retry"
 * decision is unit-testable. The rule that keeps Vercel users logged in:
 * only a 401 from the refresh endpoint itself ends the session — every
 * transient failure (5xx, 429, timeout, no response, e.g. a cold start)
 * is retried with backoff and otherwise rethrown without signing out.
 */

/** Delays between refresh retries for transient failures. */
export const REFRESH_RETRY_DELAYS_MS = [500, 1500] as const;

/** Extracts an HTTP status from an ofetch-style or h3-style error. */
export const getRefreshErrorStatus = (refreshError: unknown): number | null => {
  if (typeof refreshError !== "object" || refreshError === null) return null;
  const fromResponse = (refreshError as { response?: { status?: unknown } })
    .response?.status;
  if (typeof fromResponse === "number") return fromResponse;
  const direct = (refreshError as { statusCode?: unknown }).statusCode;
  return typeof direct === "number" ? direct : null;
};

/**
 * True when a failed refresh is worth retrying: no status at all
 * (network/timeout), rate-limited, or a server error. A 401 means the
 * token itself was rejected and must never be retried.
 */
export const isRetryableRefreshError = (refreshError: unknown): boolean => {
  const status = getRefreshErrorStatus(refreshError);
  return status === null || status === 429 || status >= 500;
};
