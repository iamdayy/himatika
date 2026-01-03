import { defineStore } from "pinia";
import type {
  IAgenda,
  IAspiration,
  ILeaderboard,
  IPoint,
  IProject,
} from "~~/types";
import type {
  IAgendaMeResponse,
  IAgendaResponse,
  IAspirationMeResponse,
  ILastPointResponse,
  ILeaderboardsResponse,
  IProjectMeResponse,
} from "~~/types/IResponse";

export const useStatsStore = defineStore("stats", () => {
  // --- Dependencies ---
  const { $api } = useNuxtApp();
  const { canMeRegister } = useCanMeRegister();

  // --- State (Data Mentah) ---
  const rawAgendas = ref<IAgenda[]>([]);
  const rawAgendasCount = ref(0);
  const aspirations = ref<IAspiration[]>([]);
  const points = ref<ILeaderboard[]>([]);
  const lastPoint = ref<IPoint>();
  const rawAgendasMe = ref<{ committee?: IAgenda[]; participant?: IAgenda[] }>({
    committee: [],
    participant: [],
  });
  const rawAgendasMeCount = ref(0);
  const rawProjectsMe = ref<IProject[]>([]);
  const rawProjectsMeCount = ref(0);

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
  async function fetchAgendasMe() {
    try {
      const response = await $api<IAgendaMeResponse>("/api/me/agenda");
      rawAgendasMe.value = response.data?.agendas || {
        committee: [],
        participant: [],
      };
      rawAgendasMeCount.value = response.data?.length || 0;
    } catch (error) {
      console.error("Failed to fetch agendas", error);
    }
  }

  async function fetchProjectsMe() {
    try {
      const response = await $api<IProjectMeResponse>("/api/me/project");
      rawProjectsMe.value = response.data?.projects || [];
      rawProjectsMeCount.value = response.data?.length || 0;
    } catch (error) {
      console.error("Failed to fetch projects", error);
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
      const response = await $api<ILeaderboardsResponse>(
        "/api/point/leaderboards"
      );
      points.value = response.data?.points || [];
    } catch (error) {
      console.error("Failed to fetch points", error);
    }
  }

  async function fetchLastPoint() {
    try {
      const response = await $api<ILastPointResponse>("/api/me/point/last");
      lastPoint.value = response.data?.point;
    } catch (error) {
      console.error("Failed to fetch last point", error);
    }
  }

  // Fungsi wrapper untuk memanggil semua (mirip init di composable)
  async function init() {
    await Promise.all([
      fetchAgendas(),
      fetchAspirations(),
      fetchPoints(),
      fetchAgendasMe(),
      fetchProjectsMe(),
      fetchLastPoint(),
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
    return rawProjectsMe.value.filter((project) => project.published) || [];
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
    lastPoint,
  };
});
