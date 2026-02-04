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
        } as any;
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
        const { token, refreshToken, setToken } = useAuthState();
        const { signOut } = useAuth();

        // If no refresh token is available, logout immediately
        if (!refreshToken.value) {
            await signOut({ callbackUrl: "/login", redirect: true });
            throw error;
        }

        // Initialize refresh process if not already running
        if (!isRefreshing) {
          isRefreshing = $fetch("/api/refresh", {
            method: "POST",
            body: { refreshToken: refreshToken.value },
          })
            .then((res: any) => {
              // Update the token in the state
              setToken(res.token);
              isRefreshing = null;
            })
            .catch(async (e) => {
              // If refresh fails, logout and throw existing error
              isRefreshing = null;
              await signOut({ callbackUrl: "/login", redirect: true });
              throw error; // Throw the original 401 (or the refresh error 'e')
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
