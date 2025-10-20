// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  hooks: {
    close: (nuxt) => {
      if (!nuxt.options._prepare) process.exit();
    },
  },
  routeRules: {
    "/api/*": {
      cors: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    },
  },
  ssr: false,
  devtools: { enabled: true },
  runtimeConfig: {
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
    public: {
      appname: process.env.APPNAME,
      api_uri: process.env.PUBLIC_URI_API,
      public_uri: process.env.PUBLIC_URI,
      version: process.env.VERSION,
    },
  },
  modules: [
    "@nuxt/image",
    "@nuxt/ui",
    "@sidebase/nuxt-auth",
    "nuxt-i18n-micro",
    "nuxt-qrcode",
    "@vueuse/nuxt",
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
        sameSiteAttribute: "none",
        secureCookieAttribute: true,
        cookieDomain: process.env.COOKIE_DOMAIN,
      },
      refresh: {
        isEnabled: true,
        endpoint: { path: "/refresh", method: "post" },
        token: {
          cookieName: "auth.refresh-token",
          signInResponseRefreshTokenPointer: "/refreshToken",
          refreshRequestTokenPointer: "/refreshToken",
          // maxAgeInSeconds: 2592000,
          // sameSiteAttribute: "none",
          // secureCookieAttribute: true,
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
