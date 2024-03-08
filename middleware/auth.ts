export default defineNuxtRouteMiddleware((to, from) => {
    if (to.path == "/dashboard") {
        return navigateTo('/login');
    }
    // if (to.path !== '/') {
    // }
  })