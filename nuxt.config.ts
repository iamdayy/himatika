// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      link: [
        {
          rel: "icon",
          type: "image/icon",
          href: "https://himatika.s3.amazonaws.com/favicon.ico",
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      mongodb_uri: process.env.MONGODB_URI,
      dbName: "himatika",
    },
  },
  devtools: { enabled: true },
  modules: [
    "@nuxtjs/color-mode",
    "@nuxt/image",
    "@sidebase/nuxt-auth",
    "@nuxtjs/tailwindcss",
    "nuxt-icon",
    "@samk-dev/nuxt-vcalendar",
    "nuxt-aos",
  ],
  auth: {
    provider: {
      type: "refresh",
      endpoints: {
        signIn: { path: "/login", method: "post" },
        signUp: { path: "/register", method: "post" },
        signOut: { path: "/logout", method: "get" },
        getSession: { path: "/session", method: "get" },
        refresh: { path: "/refresh", method: "post" },
      },
      token: {
        signInResponseTokenPointer: "/token/accessToken",
      },
      refreshToken: {
        signInResponseRefreshTokenPointer: "/token/refreshToken",
      },
      refreshOnlyToken: true,
      sessionDataType: { profile: "IProfile", username: "string" },
    },
    session: {
      enableRefreshPeriodically: 3600000,
      enableRefreshOnWindowFocus: true,
    },
    baseURL: "/api",
    globalAppMiddleware: {
      isEnabled: true,
    },
  },
  image: {},
  colorMode: {
    preference: "light",
    classSuffix: "",
  },
});
