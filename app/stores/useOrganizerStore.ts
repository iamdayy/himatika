import { defineStore } from "pinia";

export const useOrganizerStore = defineStore("organizer", () => {
  const { data: user, status } = useAuth();

  // Menggunakan Computed: Otomatis berubah jika user/status berubah
  const isOrganizer = computed(() => {
    if (status.value !== "authenticated") return false;
    return !!user.value?.member?.organizer;
  });

  const organizer = computed(() => {
    return isOrganizer.value ? user.value?.member?.organizer : null;
  });

  return {
    isOrganizer,
    organizer,
  };
});
