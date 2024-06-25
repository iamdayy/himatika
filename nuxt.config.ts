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
      mongodb_username: process.env.MONGODB_USERNAME,
      mongodb_password: process.env.MONGODB_password,
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
    "@bg-dev/nuxt-s3",
    "@nuxtjs/sanity",
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
  s3: {
    accessKeyId: process.env.NUXT_S3_ACCESS_KEY_ID,
    bucket: process.env.NUXT_S3_BUCKET,
    // endpoint: process.env.NUXT_S3_ENDPOINT,
    region: process.env.NUXT_S3_REGION,
    secretAccessKey: process.env.NUXT_S3_SECRET_ACCESS_KEY,
    driver: "s3",
    maxSizeMb: 30,
    accept: "^image/(png|jpeg|png|gif)",
    // driver: 'fs'
  },
  colorMode: {
    preference: "system",
    fallback: "dark",
    classSuffix: "",
  },
  sanity: {
    projectId: process.env.SANITY_PROJECT_ID,
    visualEditing: {
      studioUrl: process.env.SANITY_STUDIO_URL,
      token: process.env.SANITY_TOKEN,
    },
  },
});
