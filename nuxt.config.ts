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

    // 2. Homepage & Berita: Update cache setiap 1 jam (SWR)
    // Server membuat HTML sekali, lalu disimpan di CDN Vercel
    "/news/**": { swr: 3600 },
    "/agendas/**": { swr: 3600 },

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
        "Access-Control-Allow-Origin": "*",
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
    mailtrap_token: process.env.MAILTRAP_TOKEN,
    mailtrap_domain: process.env.MAILTRAP_DOMAIN,
    recaptcha_site_key: process.env.RECAPTCHA_SITE_KEY,
    recaptcha_secret_key: process.env.RECAPTCHA_SECRET_KEY,
    midtrans_url: process.env.MIDTRANS_URL,
    midtrans_client_key: process.env.MIDTRANS_CLIENT_KEY,
    midtrans_server_key: process.env.MIDTRANS_SERVER_KEY,
r2_access_account_id: process.env.R2_ACCESS_ACCOUNT_ID,
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
  ],
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
    provider: "cloudflare",
    cloudflare: {
      baseURL: process.env.PUBLIC_URI,
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
            class: "string",
            semester: "number",
            birth: {
              place: "string",
              date: "Date",
            },
            sex: "'female' | 'male'",
            religion: "string",
            citizen: "string",
            phone: "string",
            email: "string",
            address: "IAddress",
            isRegistered: "boolean",
            enteredYear: "number",
            point:
              "{ semester: number, range: { start: Date, end: Date }, point: number, activities: any }[]",
            agendas: {
              committees: "IAgenda[]",
              members: "IAgenda[]",
            },
            projects: "IProject[]",
            organizer: "IOrganizer",
            aspirations: "IAspiration[]",
            documents: "IDoc[]",
            docsRequestSign: "IDoc[]",
          },
        },
      },
    },
    sessionRefresh: {
      enableOnWindowFocus: true,
      enablePeriodically: 1000 * 60 * 60,
    },
  },
});
