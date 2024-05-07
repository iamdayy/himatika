import type { IAdministrator, IPeriod, IProfile } from "~/types";

export const useRole = (canAccess?: string[]) => {
    const { data: me, status } = useAuth();
    const role = ref<string| null>(null);
    const period = ref<IPeriod| null>(null);
    const isAdmin = ref<boolean>(false);
    const fetchData = () => {
        role.value = null;
        if (status.value == 'authenticated') {
            const NIM = me.value?.profile.NIM;
            $fetch<IAdministrator>("/api/administrator", {
                method: "get",
                query: {
                    NIM
                }
            }).then(data => {
                if (!data) {
                    role.value = 'Member';
                }
                if (data) {
                    role.value = data.AdministratorMembers.find((member) => (member.profile as IProfile).NIM === NIM)?.role || 'Member';
                    isAdmin.value = true;
                    period.value = data.period!;
                }
            });
        }
    }
    watchEffect(() => {
        fetchData();
    })
    const access = computed(() => canAccess?.includes(role.value!)!)
    return {
        role,
        access,
        isAdmin,
        period
    };
}