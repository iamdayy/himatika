export default defineNuxtRouteMiddleware(async (to, from) => {
  if (import.meta.server) return;
  if (from.path === to.path) return;
  if (to.path === "/login") {
    if (from.path === "/verify") {
      return;
    }
    const previousUrl = useCookie("previousUrl");
    previousUrl.value = from.fullPath;
  }
});
