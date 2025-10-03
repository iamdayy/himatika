// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  nitro: {
    // preset: "vercel",
    // output: {
    //   dir: "../../.vercel/output", // Example for an app in 'apps/my-app'
    // },
  },
  devtools: { enabled: true },
  runtimeConfig: {
    mongodb_uri: process.env.MONGODB_URI,
    mongodb_username: process.env.MONGODB_USERNAME,
    mongodb_password: process.env.MONGODB_PASSWORD,
    dbName: process.env.DBNAME,
    storageDir: process.env.STORAGE_DIR,
    mailtrap_token: process.env.MAILTRAP_TOKEN,
    mailtrap_domain: process.env.MAILTRAP_DOMAIN,
    recaptcha_site_key: process.env.RECAPTCHA_SITE_KEY,
    recaptcha_secret_key: process.env.RECAPTCHA_SECRET_KEY,
    midtrans_url: process.env.MIDTRANS_URL,
    midtrans_client_key: process.env.MIDTRANS_CLIENT_KEY,
    midtrans_server_key: process.env.MIDTRANS_SERVER_KEY,
    public: {
      sign_service_uri: process.env.SIGN_SERVICE_URI,
      appname: process.env.APPNAME,
      api_uri: process.env.PUBLIC_URI_API,
      public_uri: process.env.PUBLIC_URI,
      form_uri_api: process.env.FORM_URI_API,
      form_uri: process.env.FORM_URI,
      version: process.env.VERSION,
    },
  },
  ssr: false,
  modules: [
    "@nuxt/image",
    "@nuxt/ui",
    "@sidebase/nuxt-auth",
    "nuxt-i18n-micro",
    "nuxt-qrcode",
    "nuxt-file-storage",
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
  fileStorage: {
    mount: process.env.STORAGE_DIR,
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
