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
  mongoose: {
    uri: process.env.MONGODB_URI,
    options: {

    },
    modelsDir: 'models'
  }
})
