import type { IEvent, IProject } from "~/types"

export const useStats = () => {
    const { eventsCanMeRegistered, eventsMe } = useEvents();
    const { ProjectsCanMeRegistered, projectsMe } = useProjects();
    const EventPercentage = computed<number>(() => {
        return (eventsMe.value.length! / eventsCanMeRegistered.value?.length!) * 100;
    })
    const ProjectPercentage = computed<number>(() => {
        return (projectsMe.value.length! / ProjectsCanMeRegistered.value?.length!) * 100;
    })
    const all = computed<number>(() => {
        return eventsMe.value.length! + projectsMe.value.length!;
    });
    const allCanMeRegister = computed<number>(() => {
        return eventsCanMeRegistered.value?.length! + ProjectsCanMeRegistered.value?.length!;
    });
    const allPercentage = computed<number>(() => {
        return (all.value / allCanMeRegister.value) * 100
    })
    return {
        eventsMe,
        projectsMe,
        EventPercentage,
        ProjectPercentage,
        all,
        allPercentage
    }
}