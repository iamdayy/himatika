import type { IDepartement, IPeriod, IProfile } from "~/types";

export const useDept = (canAccess?: string[]) => {
    const { data: me, status } = useAuth();
    const dept = ref<string| null>(null);
    const period = ref<IPeriod|null>(null);
    const isDept = ref<boolean>(false);
    const fetchData = () => {
        dept.value = null;
        if (status.value == 'authenticated') {
            const isDepartement = me.value?.profile.isDepartement as IDepartement;
            if (!isDepartement) {
                dept.value = 'Departement';
                
            }
            if (isDepartement) {
                dept.value = isDepartement.departement || 'Member';
                isDept.value = true;
                period.value = isDepartement.period;
            }
        }
    }
    watchEffect(() => {
        fetchData();
    })
    const access =  computed(() => canAccess?.includes(dept.value!)!)
    return {
        dept,
        access,
        isDept,
        period
    };
}