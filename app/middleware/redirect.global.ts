export default defineNuxtRouteMiddleware(async (to, from) => {
  // if (!import.meta.client) return;
  if (to.path === "/login") {
    if (from.path === "/verify") {
      return;
    }
    localStorage.setItem("previousUrl", from.fullPath);
  }
});
