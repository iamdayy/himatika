export default defineNuxtRouteMiddleware(async (to, from) => {
  const { isOrganizer } = useOrganizer();
  if (!isOrganizer.value) {
    return abortNavigation();
  }
});
