export const useStats = () => {
  function calc(num: number) {
    var with2Decimals = num.toString().match(/^-?\d+(?:\.\d{0,2})?/)![0];
    return parseFloat(with2Decimals);
  }
  const { eventsCanMeRegistered, eventsMe } = useEvents();
  const { ProjectsCanMeRegistered, projectsMe } = useProjects();
  const EventPercentage = computed<number>(() => {
    return calc(
      (eventsMe.value.length! / eventsCanMeRegistered.value?.length!) * 100
    );
  });
  const ProjectPercentage = computed<number>(() => {
    return calc(
      (projectsMe.value.length! / ProjectsCanMeRegistered.value?.length!) * 100
    );
  });
  const all = computed<number>(() => {
    return eventsMe.value.length! + projectsMe.value.length!;
  });
  const allCanMeRegister = computed<number>(() => {
    return (
      eventsCanMeRegistered.value?.length! +
      ProjectsCanMeRegistered.value?.length!
    );
  });
  const allPercentage = computed<number>(() => {
    return calc((all.value / allCanMeRegister.value) * 100);
  });
  return {
    eventsMe,
    projectsMe,
    EventPercentage,
    ProjectPercentage,
    all,
    allPercentage,
  };
};
