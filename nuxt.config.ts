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
    uri: 'mongodb+srv://iamdayy14:admin123@pct-shop.a7lkvlf.mongodb.net/?retryWrites=true&w=majority/himatika',
    options: {

    },
    modelsDir: 'models'
  }
})
