import type { IAdministrator, IProfile } from "~/types";

export const isRole = async () => {
    const { data: me, status } = useAuth();
    let isRole: string | undefined = 'Guest';
    if (status.value == 'authenticated') {
        const NIM = me.value?.profile.NIM;
        const { data: administrator } = await useAsyncData(() => $fetch<IAdministrator>("/api/administrator", {
            method: "get",
            query: {
                NIM
            }
        }));
        if (!administrator.value) {
            isRole = 'Member';
        } else {
            isRole = administrator.value?.AdministratorMembers.find((member) => (member.profile as IProfile).NIM === NIM)?.role;
        }
    }
    return isRole;
}