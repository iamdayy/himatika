
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  hooks: {
    close: (nuxt) => {
      if (!nuxt.options._prepare) process.exit();
    },
  },
  routeRules: {
    // 1. Dashboard & Profile: Render di browser saja (SPA)
    "/dashboard/**": { ssr: false },
    "/profile/**": { ssr: false },
    "/administrator/**": { ssr: false },
    "/api/news": {
      security: {
        xssValidator: false,
        csrf: false,
      },
    },
    "/api/news/**": {
      security: {
        xssValidator: false,
        csrf: false,
      },
    },
    "/api/agenda": {
      security: {
        xssValidator: false,
        csrf: false,
      },
    },
    "/api/agenda/**": {
      security: {
        xssValidator: false,
        csrf: false,
      },
    },
    "/api/admin/achievement": {
      security: {
        xssValidator: false,
        csrf: false,
      },
    },
    "/api/admin/achievement/**": {
      security: {
        xssValidator: false,
        csrf: false,
      },
    },
    "/api/project": {
      security: {
        xssValidator: false,
        csrf: false,
      },
    },
    "/api/project/**": {
      security: {
        xssValidator: false,
        csrf: false,
      },
    },
    "/api/config": {
      security: {
        xssValidator: false,
        csrf: false,
      },
    },

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
    "/login": { ssr: false },
    "/register": { ssr: false },
    "/forgot-password": { ssr: false },
    "/change-password": { ssr: false },
    "/change-email": { ssr: false },
    "/api/*": {
      cors: true,
      headers: {
        "Access-Control-Allow-Origin": process.env.PUBLIC_URI,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, content-length",
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
    pdf_worker_api_url: process.env.PDF_WORKER_API_URL,
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
        'img-src': ['self', 'data:', 'blob:', 'https:', 'http:',  process.env.PUBLIC_URI || 'http://localhost:3000'],
       },
       permissionsPolicy: {
        camera: ["self"],
       }
    },
    requestSizeLimiter: {
        maxRequestSizeInBytes: 10 * 1024 * 1024, // 10MB
    },
    rateLimiter: {
        driver: {
            name: 'lruCache'
        }
    },
    
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
            phone: "string",
            organizer: "{role: string; period: {start: Date; end: Date}}",
            status: "'active' | 'inactive' | 'free' | 'deleted'",
            semester: "number",
            class: "string",
            sex: "'female' | 'male'",
          },
        },
      },
    },
    sessionRefresh: {
      enableOnWindowFocus: false,
    },
  },
});