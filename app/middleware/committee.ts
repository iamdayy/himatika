import type { IAgendaResponse } from "~~/types/IResponse";

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (!process.client) {
    return;
  }
  if (to.path.includes("/agendas/") && !to.params.id) {
    return;
  }
  const { data: agenda } = useFetch("/api/agenda", {
    method: "GET",
    query: {
      id: to.params.id,
    },
    transform: (data: IAgendaResponse) => data.data?.agenda,
  });
  const { isCommittee } = useAgendas(agenda);
  const organizerState = useOrganizerStore();
  const { isOrganizer } = storeToRefs(organizerState);
  if (!isCommittee.value) {
    if (isOrganizer.value) {
      return;
    }
    return abortNavigation();
  }
});
