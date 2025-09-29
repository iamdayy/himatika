export default defineNuxtPlugin((nuxtApp) => {
  const { refresh } = useAuth();
  const router = useRouter();
  const config = useRuntimeConfig();
  const formApi = $fetch.create({
    baseURL: config.public.form_uri_api,
    onRequest({ request, options, error }) {
      const token = useCookie("auth.token");
      if (token.value) {
        const headers = options.headers || {};
        if (Array.isArray(headers)) {
          headers.push(["Authorization", `Bearer ${token.value}`]);
        } else if (headers instanceof Headers) {
          headers.set("Authorization", `Bearer ${token.value}`);
        } else {
          (
            headers as Record<string, string>
          ).Authorization = `Bearer ${token.value}`;
        }
      }
    },
    async onResponse({ request, response, options }) {
      if (response.status === 401) {
        if (response.status === 401) {
          try {
            await refresh();
            await formApi(request, options as any);
          } catch (error) {
            router.push("/login");
          }
        }
      }
    },
  });

  // Expose to useNuxtApp().$api
  return {
    provide: {
      formApi,
    },
  };
});
