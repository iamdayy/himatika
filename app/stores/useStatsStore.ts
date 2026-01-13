import { defineStore } from "pinia";
import type { IAgenda, IAspiration, IProject } from "~~/types";
import type {
  IAgendaMeResponse,
  IAgendaResponse,
  IAspirationMeResponse,
  IProjectMeResponse,
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
  const rawAgendasMe = ref<{ committee?: IAgenda[]; participant?: IAgenda[] }>({
    participant: undefined,
    committee: undefined,
  });
  const rawAgendasMeCount = ref(0);
  const rawProjectsMe = ref<IProject[]>([]);
  const rawProjectsMeCount = ref(0);
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

  async function fetchMeAgendas() {
    try {
      const response = await $api<IAgendaMeResponse>("/api/me/agenda");
      rawAgendasMe.value = response.data?.agendas || {
        committee: undefined,
        participant: undefined,
      };
      rawAgendasMeCount.value = response.data?.length || 0;
    } catch (error) {
      console.error("Failed to fetch agendas", error);
    }
  }
  async function fetchMeProjects() {
    try {
      const response = await $api<IProjectMeResponse>("/api/me/project");
      rawProjectsMe.value = response.data?.projects || [];
      rawProjectsMeCount.value = response.data?.length || 0;
    } catch (error) {
      console.error("Failed to fetch projects", error);
    }
  }

  // Fungsi wrapper untuk memanggil semua (mirip init di composable)
  async function init() {
    await Promise.all([
      fetchAgendas(),
      fetchAspirations(),
      fetchPoints(),
      fetchMeAgendas(),
      fetchMeProjects(),
    ]);
  }

  // --- Getters (Computed) ---
  // Logika ini disalin langsung dari useStats.ts Anda
  const agendasMe = computed<
    { committee?: IAgenda[]; participant?: IAgenda[] } | undefined
  >(() => {
    return rawAgendasMe.value;
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
    return rawProjectsMe.value || [];
  });

  const all = computed<number>(() => {
    return (
      (agendasMe.value?.committee?.length || 0) +
      (agendasMe.value?.participant?.length || 0) +
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
