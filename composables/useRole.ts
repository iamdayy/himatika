import type { IAdministrator, IPeriod, IProfile } from "~/types";

export const useRole = (canAccess?: string[]) => {
  const { user, loggedIn } = useAuth();
  const role = ref<string | null>(null);
  const period = ref<IPeriod | null>(null);
  const isAdmin = ref<boolean>(false);
  const fetchData = () => {
    role.value = null;
    if (loggedIn.value) {
      const NIM = user.value?.profile.NIM;
      const isAdministrator = user.value?.profile
        .isAdministrator as IAdministrator;
      if (!isAdministrator) {
        role.value = "Member";
      }
      if (isAdministrator) {
        role.value =
          isAdministrator.AdministratorMembers.find(
            (member) => (member.profile as IProfile).NIM === NIM
          )?.role || "Member";
        isAdmin.value = true;
        period.value = isAdministrator.period!;
      }
    }
  };
  watchEffect(() => {
    fetchData();
  });
  const access = computed(() => canAccess?.includes(role.value!)!);
  return {
    role,
    access,
    isAdmin,
    period,
  };
};
