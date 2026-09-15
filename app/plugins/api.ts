// app/plugins/api.ts
import { defineNuxtPlugin } from "#app";

export default defineNuxtPlugin((nuxtApp) => {
  // Lock variable to manage refresh token concurrency
  let isRefreshing: Promise<any> | null = null;

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

  const doSignOut = async () => {
    try {
      useStatsStore().clear();
    } catch {
      // store may be unavailable during plugin init
    }
    const { signOut } = useAuth();
    await signOut({ callbackUrl: "/login", redirect: true });
  };

  // Wrapper function to handle 401 errors and token refreshing
  const api = async <T = any>(request: string, options: any = {}) => {
    try {
      // Attempt the request
      return await fetcher<T>(request, options);
    } catch (error: any) {
      // Check if the error is a 401 Unauthorized
      // Guard against infinite retry loops: only attempt refresh once per request.
      if (error.response?.status === 401 && !options._retry) {
        const { refreshToken, rawRefreshToken, setToken } = useAuthState();

        // If no refresh token is available, logout immediately
        if (!refreshToken.value) {
          await doSignOut();
          throw error;
        }

        // Initialize refresh process if not already running.
        // Shared promise dedupes concurrent 401s into a single rotation.
        if (!isRefreshing) {
          const currentRefreshToken = refreshToken.value as string;
          isRefreshing = $fetch<{ token: string; refreshToken: string }>("/api/refresh", {
            method: "POST",
            body: { refreshToken: currentRefreshToken },
          })
            .then((res) => {
              // Persist BOTH rotated tokens. Only updating the access token
              // leaves the stale refresh token in state, so the next refresh
              // reuses an already-rotated token and the server revokes all sessions.
              setToken(res.token);
              rawRefreshToken.value = res.refreshToken;
              isRefreshing = null;
            })
            .catch(async (e: any) => {
              isRefreshing = null;
              // Only force logout when the refresh token itself is rejected.
              // Transient network/server errors must not wipe the session.
              if (e?.response?.status === 401 || e?.statusCode === 401) {
                await doSignOut();
              }
              throw e ?? error;
            });
        }

        // Wait for the refresh process to complete
        try {
          await isRefreshing;
        } catch (refreshError) {
          throw refreshError;
        }

        // Retry the original request once with the new token
        // The fetcher will pick up the new token from useAuthState() in its onRequest hook
        return await fetcher<T>(request, { ...options, _retry: true });
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
