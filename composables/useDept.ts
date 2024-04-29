import type { IDepartement, IProfile } from "~/types";

export const useDept = (canAccess?: string[]) => {
    const { data: me, status } = useAuth();
    const dept = ref<string| null>(null);
    const fetchData = () => {
        dept.value = null;
        if (status.value == 'authenticated') {
            const NIM = me.value?.profile.NIM;
            $fetch<IDepartement>("/api/departement", {
                method: "get",
                query: {
                    NIM
                }
            }).then(data => {
                if (!data) {
                    dept.value = 'Departement';
                    
                }
                if (data) {
                    dept.value = data.departement || 'Member';
                    
                }
            });
        }
    }
    watchEffect(() => {
        fetchData();
    })
    const access =  computed(() => canAccess?.includes(dept.value!)!)
    return {
        dept,
        access
    };
}