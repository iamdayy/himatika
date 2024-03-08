export default defineNuxtRouteMiddleware((to, from) => {
    const token = useCookie('UserCanAccess');
    if (!token.value) {
      return navigateTo("/login");
    }
});
