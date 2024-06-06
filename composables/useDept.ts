import type { IDepartement, IPeriod } from "~/types";

export const useDept = (canAccess?: string[]) => {
  const { user, loggedIn } = useAuth();
  const dept = ref<string | null>(null);
  const period = ref<IPeriod | null>(null);
  const isDept = ref<boolean>(false);
  const fetchData = () => {
    dept.value = null;
    if (loggedIn.value) {
      const isDepartement = user.value?.profile.isDepartement as IDepartement;
      if (!isDepartement) {
        dept.value = null;
      }
      if (isDepartement) {
        dept.value = isDepartement.departement || "Member";
        isDept.value = true;
        period.value = isDepartement.period;
      }
    }
  };
  watchEffect(() => {
    fetchData();
  });
  const access = computed(() => canAccess?.includes(dept.value!)!);
  return {
    dept,
    access,
    isDept,
    period,
  };
};
