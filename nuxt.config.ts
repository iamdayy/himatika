// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      mongodb_uri: process.env.MONGODB_URI,
    },
  },
  devtools: { enabled: true },
  modules: [
    'nuxt-mongoose',
    '@nuxtjs/color-mode',
    "@nuxt/image",
    "@sidebase/nuxt-auth",
    '@nuxtjs/tailwindcss',
    'nuxt-icon',
    '@samk-dev/nuxt-vcalendar',
    'nuxt-aos'
  ],
  nitro: {
    firebase: {
      gen: 2
    }
  },
  auth: {
    provider: {
        type: 'local',
        endpoints: {
          signIn: { path: "/login", method: "post" },
          signUp: { path: "/register", method: "post" },
          getSession: { path: "/session", method: "get" }
        },
        token: {
          signInResponseTokenPointer: '/token/accessToken'
        },
        sessionDataType: { profile: 'IProfile', username: "string" },
    },
    baseURL: "/api",
    globalAppMiddleware: {
      isEnabled: true
    }
  },
  mongoose: {
    uri: process.env.MONGODB_URI,
    options: {

    },
    modelsDir: 'models'
  },
  image: {
    dir: 'assets/image'
  }
})
