// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    'nuxt-mongoose',
    '@nuxtjs/color-mode',
    '@nuxtjs/tailwindcss'
  ],
  nitro: {
    firebase: {
      gen: 2
    }
  },
  mongoose: {
    uri: 'mongodb://127.0.0.1:27017/himatika',
    options: {

    },
    modelsDir: 'models'
  }
})
