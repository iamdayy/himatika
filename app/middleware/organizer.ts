export default defineNuxtRouteMiddleware(async (to, from) => {
  if (!process.client) {
    return;
  }
  const organizerState = useOrganizerStore();
  const { isOrganizer } = storeToRefs(organizerState);
  if (!isOrganizer.value) {
    return abortNavigation();
  }
});
