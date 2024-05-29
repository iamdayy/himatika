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
    "@workmate/nuxt-auth",
    "@nuxtjs/tailwindcss",
    "nuxt-icon",
    "@samk-dev/nuxt-vcalendar",
    "nuxt-aos",
  ],
  auth: {
    providers: {
      local: {
        endpoints: {
          signIn: {
            path: `${process.env.PUBLIC_URI_API}/signin`,
            method: "POST",
            tokenKey: "accessToken",
            refreshTokenKey: "refreshToken",
            body: {
              principal: "username",
              password: "password",
            },
          },
          signOut: {
            path: `${process.env.PUBLIC_URI_API}/logout`,
            method: "GET",
          },
          signUp: {
            path: `${process.env.PUBLIC_URI_API}/register`,
            method: "POST",
          },
          user: {
            path: `${process.env.PUBLIC_URI_API}/session`,
            userKey: "",
          },
          refreshToken: {
            path: `${process.env.PUBLIC_URI_API}/refresh`,
            method: "POST",
            tokenKey: "accessToken",
            refreshTokenKey: "refreshToken",
            body: {
              refreshToken: "refreshToken",
              token: "accessToken",
            },
          },
        },
      },
    },
    global: true,
    redirects: {
      redirectIfLoggedIn: "/dashboard",
      redirectIfNotLoggedIn: "/login",
    },
    apiClient: {
      baseURL: process.env.PUBLIC_URI_API || "http://localhost:3000/api",
    },
    defaultProvider: "local",
    token: {
      type: "Bearer",
      maxAge: 1000 * 60 * 60 * 24 * 30,
      cookiesNames: {
        accessToken: "auth:token",
        refreshToken: "auth:refreshToken",
        authProvider: "auth:provider",
        tokenType: "auth:tokenType",
      },
    },
  },
  image: {},
  colorMode: {
    preference: "system",
    fallback: "dark",
    classSuffix: "",
  },
});
