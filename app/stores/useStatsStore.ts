import { defineStore } from "pinia";
import type { IAgenda, IAspiration, IProject } from "~~/types";
import type {
  IAgendaResponse,
  IAspirationMeResponse,
} from "~~/types/IResponse";

interface IPoint {
  avatar?: string;
  fullName: string;
  NIM: number;
  semester?: number;
  point?: { point: number }[];
  no: number;
}

export const useStatsStore = defineStore("stats", () => {
  // --- Dependencies ---
  const { $api } = useNuxtApp();
  const { data: user } = useAuth(); // Mengambil user dari auth module
  const { canMeRegister } = useCanMeRegister();

  // --- State (Data Mentah) ---
  const rawAgendas = ref<IAgenda[]>([]);
  const rawAgendasCount = ref(0);
  const aspirations = ref<IAspiration[]>([]);
  const points = ref<IPoint[]>([]);

  // Loading States (Opsional, tapi bagus untuk UX)
  const loading = ref(false);

  // --- Actions (Fetching Data) ---
  // Menggantikan useAsyncData
  async function fetchAgendas() {
    try {
      loading.value = true;
      const response = await $api<IAgendaResponse>("/api/agenda");
      rawAgendas.value = response.data?.agendas || [];
      rawAgendasCount.value = response.data?.length || 0;
    } catch (error) {
      console.error("Failed to fetch agendas", error);
    } finally {
      loading.value = false;
    }
  }

  async function fetchAspirations() {
    try {
      const response = await $api<IAspirationMeResponse>("/api/me/aspirations");
      aspirations.value = response.data?.aspiration || [];
    } catch (error) {
      console.error("Failed to fetch aspirations", error);
    }
  }

  async function fetchPoints() {
    try {
      const response = await $api<any>("/api/point");
      points.value = response.data?.points || [];
    } catch (error) {
      console.error("Failed to fetch points", error);
    }
  }

  // Fungsi wrapper untuk memanggil semua (mirip init di composable)
  async function init() {
    await Promise.all([fetchAgendas(), fetchAspirations(), fetchPoints()]);
  }

  // --- Getters (Computed) ---
  // Logika ini disalin langsung dari useStats.ts Anda
  const agendasMe = computed<
    { committees?: IAgenda[]; members?: IAgenda[] } | undefined
  >(() => {
    return user.value?.member.agendas;
  });

  const agendasCanMeRegistered = computed<IAgenda[] | undefined>(() => {
    return rawAgendas.value.filter((agenda) =>
      canMeRegister(
        agenda.configuration.participant.canRegister as string,
        agenda.configuration.participant.canRegisterUntil.end
      )
    );
  });

  const projectsMe = computed<IProject[]>(() => {
    return user.value?.member.projects || [];
  });

  const all = computed<number>(() => {
    return (
      (agendasMe.value?.committees?.length || 0) +
      (agendasMe.value?.members?.length || 0) +
      (projectsMe.value.length || 0)
    );
  });

  const allCanMeRegister = computed<number>(() => {
    return agendasCanMeRegistered.value?.length || 0;
  });

  // --- Return ---
  return {
    // State
    rawAgendas,
    aspirations,
    points,
    loading,
    // Actions
    fetchAgendas,
    fetchAspirations,
    fetchPoints,
    init,
    // Getters
    agendasMe,
    projectsMe,
    agendasCanMeRegistered,
    all,
    allCanMeRegister,
  };
});
