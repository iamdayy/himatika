// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  hooks: {
    close: (nuxt) => {
      if (!nuxt.options._prepare) process.exit();
    },
  },
  routeRules: {
    // 1. Dashboard & Profile: Render di browser saja (SPA)
    // Mengurangi beban CPU server drastis karena server hanya kirim JSON API
    "/dashboard/**": { ssr: false },
    "/profile/**": { ssr: false },
    "/administrator/**": { ssr: false },

    // 2. Homepage & Berita: Update cache setiap 10 detik (SWR)
    // Server membuat HTML sekali, lalu disimpan di CDN Vercel
    "/news/**": { swr: 10 },
    "/agendas/**": { swr: 10 },
    
    // 2.1 API Caching (Optimasi)
    "/api/news/**": { swr: 60 },
    "/api/agendas/**": { swr: 60 },
    "/api/gallery/**": { swr: 300 },

    // 2.2 Security Rate Limiting (Nuxt Security)
    "/api/signin": {
        security: {
            rateLimiter: {
                tokensPerInterval: 10,
                interval: 60000,
                headers: false,
            }
        }
    },
    "/api/signup": {
        security: {
            rateLimiter: {
                tokensPerInterval: 10,
                interval: 60000,
                headers: false,
            }
        }
    },
    "/api/reset-password": {
        security: {
            rateLimiter: {
                tokensPerInterval: 10,
                interval: 60000,
                headers: false,
            }
        }
    },

    // 3. Halaman yang tidak pernah berubah (Static)
    // Dibuat saat 'npm run build', 0ms loading time di server
    "/login": { prerender: true },
    "/register": { prerender: true },
    "/forgot-password": { prerender: true },
    "/change-password": { prerender: true },
    "/change-email": { prerender: true },
    "/api/*": {
      cors: true,
      headers: {
        "Access-Control-Allow-Origin": process.env.PUBLIC_URI,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    },
  },
  sourcemap: {
    server: false,
    client: false,
  },
  ssr: true,
  devtools: { enabled: true },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET,
    mongodb_uri: process.env.HIMATIKA_MONGODB_URI,
    dbName: process.env.DBNAME,
    vercelBlobToken: process.env.BLOB_READ_WRITE_TOKEN,
    storageDir: process.env.BLOB_URI,
    // mailtrap_token: process.env.MAILTRAP_TOKEN,
    // mailtrap_domain: process.env.MAILTRAP_DOMAIN,
    resend_api_key: process.env.RESEND_API_KEY,
    resend_from: process.env.RESEND_FROM,
    recaptcha_site_key: process.env.RECAPTCHA_SITE_KEY,
    recaptcha_secret_key: process.env.RECAPTCHA_SECRET_KEY,
    midtrans_url: process.env.MIDTRANS_URL,
    midtrans_client_key: process.env.MIDTRANS_CLIENT_KEY,
    midtrans_server_key: process.env.MIDTRANS_SERVER_KEY,
    r2_account_id: process.env.R2_ACCOUNT_ID,
    r2_access_key_id: process.env.R2_ACCESS_KEY_ID,
    r2_secret_access_key: process.env.R2_SECRET_ACCESS_KEY,
    r2_bucket_name: process.env.R2_BUCKET_NAME,
    r2_public_domain: process.env.R2_PUBLIC_DOMAIN,
    public: {
      appname: process.env.APPNAME,
      api_uri: process.env.PUBLIC_URI_API,
      public_uri: process.env.PUBLIC_URI,
      version: process.env.VERSION,
    },
  },
  app: {
    pageTransition: { name: "page", mode: "out-in" },
    layoutTransition: { name: "layout", mode: "out-in" },
  },
  modules: [
    "@nuxt/image",
    "@nuxt/ui",
    "@sidebase/nuxt-auth",
    "nuxt-i18n-micro",
    "nuxt-qrcode",
    "@vueuse/nuxt",
    "@pinia/nuxt",
    "nuxt-security",
    "@vite-pwa/nuxt",
  ],
  pwa: {
    manifest: {
      name: "Himatika App",
      short_name: "Himatika",
      description: "Aplikasi Sistem Informasi Himpunan Mahasiswa Informatika ITSNU Pekalongan",
      theme_color: "#ffffff",
      icons: [
        {
          src: "android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    },
    workbox: {
      navigateFallback: "/",
      globPatterns: ["**/*.{js,css,html,png,svg,ico,woff2}"],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "google-fonts-cache",
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "gstatic-fonts-cache",
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600,
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallbackAllowlist: [/^\/$/],
      type: "module",
    },
  },  
  security: {
    headers: {
       crossOriginEmbedderPolicy: 'unsafe-none',
       contentSecurityPolicy: {
        'img-src': ["'self'", 'data:', 'blob:', 'https:', 'http:',  process.env.PUBLIC_URI || 'http://localhost:3000'],
       }
    },
    rateLimiter: {
        driver: {
            name: 'lruCache'
        }
    }
  },
  css: ["./app/assets/css/main.css"],
  colorMode: {
    preference: "system",
    fallback: "light",
  },
  i18n: {
    strategy: "no_prefix",
    locales: [
      { code: "en", iso: "en-US", dir: "ltr" },
      { code: "id", iso: "id-ID", dir: "ltr" },
      { code: "ar", iso: "ar-SA", dir: "rtl" },
    ],
    defaultLocale: "id",
    translationDir: "locales",
    meta: true,
    autoDetectPath: "*",
  },
  qrcode: {
    options: {
      variant: {
        inner: "circle",
        marker: "rounded",
        pixel: "rounded",
      },
      radius: 1,
      blackColor: "currentColor",
      whiteColor: "transparent",
    },
  },
  image: {
    providers: {
      imagekit: {
        name: "localProvider",
        provider: "~/providers/localProvider.ts",
        options: {
          // ... provider options
          baseURL: process.env.PUBLIC_URI,
        },
      },
    },
    dir: "public",
    format: ["webp"],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
      "2xl": 1536,
    },
  },
  fonts: {
    provider: "google",
  },
  icon: {
    collections: ["heroicons", "uil", "ion", "ph"],
    serverBundle: {
      externalizeIconsJson: true,
    },
  },
  ui: {},
  auth: {
    baseURL: "/api",
    globalAppMiddleware: true,
    provider: {
      type: "local",
      endpoints: {
        signIn: { path: "/signin", method: "post" },
        signOut: { path: "/signout", method: "get" },
        getSession: { path: "/session", method: "get" },
      },
      token: {
        type: "Bearer",
        cookieName: "auth.token",
        headerName: "Authorization",
        maxAgeInSeconds: 604800,
        sameSiteAttribute:
          process.env.NODE_ENV === "production" ? "none" : "lax",
        secureCookieAttribute: process.env.NODE_ENV === "production",
        cookieDomain: process.env.COOKIE_DOMAIN,
      },
      refresh: {
        isEnabled: true,
        endpoint: { path: "/refresh", method: "post" },
        token: {
          cookieName: "auth.refresh-token",
          signInResponseRefreshTokenPointer: "/refreshToken",
          refreshResponseTokenPointer: "/token",
          refreshRequestTokenPointer: "/refreshToken",
          sameSiteAttribute:
            process.env.NODE_ENV === "production" ? "none" : "lax",
          secureCookieAttribute: process.env.NODE_ENV === "production",
          cookieDomain: process.env.COOKIE_DOMAIN,
        },
      },
      session: {
        dataType: {
          username: "string",
          key: "string",
          token: "string",
          member: {
            NIM: "number",
            fullName: "string",
            avatar: "string",
            email: "string",
            organizer: "{role: string; period: {start: Date; end: Date}}",
            status: "string",
            semester: "number",
            class: "string",
            sex: "'female' | 'male'",
          },
        },
      },
    },
    sessionRefresh: {
      enableOnWindowFocus: true,
    },
  },
});