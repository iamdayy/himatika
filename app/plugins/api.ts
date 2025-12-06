// app/plugins/api.ts
import { defineNuxtPlugin } from "#app";

export default defineNuxtPlugin((nuxtApp) => {
  // 1. Variabel Lock (Disimpan di luar scope interceptor agar shared)
  // Menyimpan promise refresh yang sedang berjalan
  let isRefreshing: Promise<any> | null = null;

  const api = $fetch.create({
    baseURL: useRuntimeConfig().public.public_uri || "/api", // Sesuaikan dengan config kamu

    // Request Interceptor: Pasang token terbaru
    async onRequest({ options }) {
      const { token } = useAuthState();
      if (token.value) {
        options.headers = {
          ...options.headers,
          Authorization: token.value,
        } as any;
      }
    },

    // Response Error Interceptor: Handle 401 & Locking
    async onResponseError({ response, options, request }) {
      if (response.status === 401) {
        const { token, refreshToken, setToken } = useAuthState();

        // Jika tidak ada refresh token, langsung logout (tidak bisa diselamatkan)
        if (!refreshToken.value) {
          nuxtApp.runWithContext(() => navigateTo("/login"));
          return Promise.reject();
        }

        // --- MULAI LOGIKA PROMISE LOCKING ---

        // Cek apakah ada proses refresh yang sedang berjalan?
        if (!isRefreshing) {
          // Jika TIDAK, kita yang memulainya.
          // Simpan Promise refresh ke variabel 'isRefreshing'
          isRefreshing = $fetch("/api/refresh", {
            method: "POST",
            body: { refreshToken: refreshToken.value },
          })
            .then((res: any) => {
              // Update token baru ke state
              setToken(res.token);
              // Sukses: Update token baru
              isRefreshing = null;
              return Promise.resolve();
            })
            .catch((error) => {
              // Gagal: Token refresh expired/invalid
              isRefreshing = null; // Reset lock
              nuxtApp.runWithContext(() => navigateTo("/login"));
              return Promise.reject(error);
            });
        }

        // --- END LOGIKA PROMISE LOCKING ---

        // Tunggu proses refresh selesai (baik itu kita yang mulai atau orang lain)
        await isRefreshing;

        // Setelah refresh selesai, coba ulang request ORIGINAL yang tadi gagal
        // Kita harus update header Authorization dengan token BARU dan method yang benar
        await $fetch(request, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${token.value}`, // Token baru
          },
          method: options.method, // Pastikan method asli tetap digunakan
        } as any);
        return Promise.resolve(); // Sukses setelah retry
      }
    },
  });

  // Expose $api ke seluruh aplikasi
  return {
    provide: {
      api,
    },
  };
});
