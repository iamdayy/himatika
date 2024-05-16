import type { IProject, TRole } from "~/types";

export const useProjects = () => {
    const { canMeRegister } = useCanMeRegister()
    const { data: Projects, refresh: refreshProjects } = useAsyncData(() => $fetch<IProject[]>("/api/project"));
    const { data: me } = useAuth()
    const projectsMe = me.value?.profile.projects;
    const ProjectsCanMeRegistered = Projects.value?.filter((Project) => canMeRegister(Project.canRegister));
    return {
        Projects,
        projectsMe,
        ProjectsCanMeRegistered,
        refreshProjects
    }
}