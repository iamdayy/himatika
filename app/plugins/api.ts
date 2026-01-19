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
        const { signOut } = useAuth();
        if (!refreshToken.value) {
          await signOut({ callbackUrl: "/login", redirect: true });
          return Promise.reject();
        }

        // --- MULAI LOGIKA PROMISE LOCKING ---

        // 0. Cek Optimis: Apakah token di state SUDAH berbeda dengan token di header request ini?
        // Jika ya, berarti sudah ada reload/refresh lain yang sukses barusan.
        const currentToken = token.value;
        const usedToken = (options.headers as any)?.Authorization;
        
        // Asumsi format "Bearer <token>"
        if (currentToken && usedToken && currentToken !== usedToken) {
           // Token sudah baru, langsung retry tanpa refresh
           return $fetch(request, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: currentToken, 
            },
          } as any);
        }

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
            .catch(async (error) => {
              // Gagal: Token refresh expired/invalid
              isRefreshing = null; // Reset lock
              await signOut({ callbackUrl: "/login", redirect: true });
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
