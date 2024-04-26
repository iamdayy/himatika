import type { IDepartement, IProfile } from "~/types";

export const useDept = (canAccess?: string) => {
    const { data: me, status } = useAuth();
    const dept = ref<string| null>(null);
    const access = ref<boolean|null>(false);
    const fetchData = () => {
        dept.value = null;
        access.value = false;
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
    access.value = dept.value == canAccess;
    return {
        dept,
        access
    };
}