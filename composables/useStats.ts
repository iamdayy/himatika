import type { IEvent, IProject } from "~/types"

export const useStats = () => {
    const { eventsCanMeRegistered, eventsMe } = useEvents();
    const EventPercentage = (eventsMe.length! / eventsCanMeRegistered?.length!) * 100;
    const { ProjectsCanMeRegistered, projectsMe } = useProjects();
    const ProjectPercentage = (projectsMe.length! / ProjectsCanMeRegistered?.length!) * 100;
    const all = eventsMe.length! + projectsMe.length!;
    const allCanMeRegister = eventsCanMeRegistered?.length! + ProjectsCanMeRegistered?.length!;
    return {
        eventsMe,
        projectsMe,
        EventPercentage,
        ProjectPercentage,
        all,
        allPercentage: (all / allCanMeRegister) * 100
    }
}