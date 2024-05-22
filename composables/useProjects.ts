import type { IProject, TRole } from "~/types";
import type { IProjectResponse } from "~/types/IResponse";

export const useProjects = () => {
    const page = ref<number>(1);
    const perPage = ref<number>(10);
    const { canMeRegister } = useCanMeRegister();
    const { data: me } = useAuth();
    const { data, refresh: refreshProjects } = useAsyncData(() => $fetch<IProjectResponse>("/api/project", {
        query: {
            page: page.value,
            perPage: perPage.value
        }
    }));
    const projects = computed<IProject[]|undefined>(() => {
        return data.value?.projects;
    });
    const totalProjects = computed<number|undefined>(() => {
        return data.value?.length;
    })
    const projectsMe = computed<IProject[]>(() => {
        return me.value?.profile.projects;
    });
    const ProjectsCanMeRegistered = computed<IProject[]|undefined>(() => {
        return data.value?.projects.filter((Project) => canMeRegister(Project.canRegister));
    })
    return {
        projects,
        page,
        perPage,
        totalProjects,
        projectsMe,
        ProjectsCanMeRegistered,
        refreshProjects
    }
}