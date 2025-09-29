// plugins/domparser.client.js
export default defineNuxtPlugin((nuxtApp) => {
  const domParser = new DOMParser();

  return {
    provide: {
      domParser,
    },
  };
});
