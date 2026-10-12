// app/plugins/api.ts
import { defineNuxtPlugin } from "#app";

export default defineNuxtPlugin((nuxtApp) => {
  // Lock variable to manage refresh token concurrency
  let isRefreshing: Promise<any> | null = null;

  // Delays between refresh retries for transient (non-401) failures such
  // as cold starts, timeouts, or 5xx responses.
  const REFRESH_RETRY_DELAYS_MS = [500, 1500];

  const getRefreshErrorStatus = (refreshError: unknown): number | null => {
    if (typeof refreshError !== "object" || refreshError === null) return null;
    const fromResponse = (refreshError as { response?: { status?: unknown } })
      .response?.status;
    if (typeof fromResponse === "number") return fromResponse;
    const direct = (refreshError as { statusCode?: unknown }).statusCode;
    return typeof direct === "number" ? direct : null;
  };

  const isRetryableRefreshError = (refreshError: unknown): boolean => {
    const status = getRefreshErrorStatus(refreshError);
    return status === null || status === 429 || status >= 500;
  };

  // Create a fetcher instance with base configuration
  const fetcher = $fetch.create({
    baseURL: useRuntimeConfig().public.public_uri || "/api",
    async onRequest({ options }) {
      const { token } = useAuthState();
      if (token.value) {
        options.headers = {
          ...options.headers,
          Authorization: token.value,
        } as Headers;
      }
    },
  });

  // Wrapper function to handle 401 errors and token refreshing
  const api = async <T = any>(request: string, options: any = {}) => {
    try {
      // Attempt the request
      return await fetcher<T>(request, options);
    } catch (error: any) {
      // Check if the error is a 401 Unauthorized
      if (error.response?.status === 401) {
        const { refreshToken } = useAuthState();
        const { refresh, signOut } = useAuth();

        // If no refresh token is available, logout immediately
        if (!refreshToken.value) {
          useStatsStore().clear();
          await signOut({ callbackUrl: "/login", redirect: true });
          throw error;
        }

        // Initialize refresh process if not already running.
        // useAuth().refresh() updates BOTH the access token and the
        // refresh token in the auth state. Updating only the access token
        // would leave a rotated-out refresh token behind, and the next
        // refresh would be mistaken for token theft — logging the user
        // out on every device.
        if (!isRefreshing) {
          const attemptRefresh = async (attempt: number): Promise<void> => {
            try {
              await refresh();
            } catch (refreshError: unknown) {
              // 401 from the refresh endpoint means the token is genuinely
              // invalid (revoked/rotated-out/expired): never retry that.
              // Anything else (5xx, timeout, no response — e.g. a Vercel
              // cold start) is transient: retry with backoff. The server
              // honors recently-rotated tokens, so a retry is safe even if
              // the first attempt went through.
              if (
                attempt < REFRESH_RETRY_DELAYS_MS.length &&
                isRetryableRefreshError(refreshError)
              ) {
                await new Promise((resolve) =>
                  setTimeout(resolve, REFRESH_RETRY_DELAYS_MS[attempt])
                );
                return attemptRefresh(attempt + 1);
              }
              throw refreshError;
            }
          };
          isRefreshing = attemptRefresh(0)
            .then(() => {
              isRefreshing = null;
            })
            .catch(async (refreshError: unknown) => {
              isRefreshing = null;
              // End the local session ONLY when the refresh endpoint
              // rejected the token itself (401). Transient failures keep
              // the local session intact so the next user action retries
              // instead of logging the user out.
              if (getRefreshErrorStatus(refreshError) === 401) {
                useStatsStore().clear();
                await signOut({ callbackUrl: "/login", redirect: true });
              }
              throw error; // Throw the original 401
            });
        }

        // Wait for the refresh process to complete
        await isRefreshing;

        // Retry the original request
        // The fetcher will pick up the new token from useAuthState() in its onRequest hook
        return await fetcher<T>(request, options);
      }

      // Rethrow other errors
      throw error;
    }
  };

  // Expose $api to the application
  return {
    provide: {
      api,
    },
  };
});
