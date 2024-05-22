import type { IEvent, IProject } from "~/types"

export const useStats = () => {
    const { eventsCanMeRegistered, eventsMe } = useEvents();
    const EventPercentage = (eventsMe.length! / eventsCanMeRegistered?.length!) * 100;
    const { ProjectsCanMeRegistered, projectsMe } = useProjects();
    const ProjectPercentage = (projectsMe.value.length! / ProjectsCanMeRegistered.value?.length!) * 100;
    const all = eventsMe.length! + projectsMe.value.length!;
    const allCanMeRegister = eventsCanMeRegistered?.length! + ProjectsCanMeRegistered.value?.length!;
    return {
        eventsMe,
        projectsMe,
        EventPercentage,
        ProjectPercentage,
        all,
        allPercentage: (all / allCanMeRegister) * 100
    }
}