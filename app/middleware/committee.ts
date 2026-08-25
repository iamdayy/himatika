import type { IAgenda } from "~~/types";
import type { IAgendaResponse } from "~~/types/IResponse";

export default defineNuxtRouteMiddleware(async (to) => {
  if (!process.client) {
    return;
  }
  const agendaId = to.params.id as string | undefined;
  if (to.path.includes("/agendas/") && !agendaId) {
    return;
  }

  // Resolve authorization from REAL data. The previous implementation read an
  // un-awaited useFetch ref (always undefined at this point), so the guard
  // aborted navigation regardless of committee status.
  const agenda = ref<IAgenda | undefined>(undefined);
  try {
    const { $api } = useNuxtApp();
    const res = await $api<IAgendaResponse>("/api/agenda", {
      query: { id: agendaId },
    });
    agenda.value = res.data?.agenda;
  } catch {
    return abortNavigation();
  }

  const { isCommittee } = useAgendas(agenda);
  if (!isCommittee.value) {
    return abortNavigation();
  }
});
