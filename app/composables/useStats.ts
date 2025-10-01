import type { IAgenda, IAspiration, IProject } from "~~/types";
import type {
  IAgendaResponse,
  IAspirationMeResponse,
} from "~~/types/IResponse";
interface IPoint {
  avatar?: string;
  fullName: string;
  NIM: number;
  semester?: number;
  point?: { point: number }[];
  no: number;
}
export const useStats = () => {
  const { $api } = useNuxtApp();
  const { data: user } = useAuth();
  const { canMeRegister } = useCanMeRegister();
  const { data: agendas } = useAsyncData(
    "agendas",
    () => $api<IAgendaResponse>("/api/agenda"),
    {
      transform: (data) => {
        const agendas = data.data?.agendas || [];
        const agendasCount = data.data?.length || 0;
        return {
          data: agendas,
          count: agendasCount,
        };
      },
      default: () => ({
        data: [],
        count: 0,
      }),
    }
  );
  const agendasMe = computed<
    { committees?: IAgenda[]; members?: IAgenda[] } | undefined
  >(() => {
    return user.value?.member.agendas;
  });
  const agendasCanMeRegistered = computed<IAgenda[] | undefined>(() => {
    return agendas.value?.data.filter((agenda) =>
      canMeRegister(
        agenda.configuration.participant.canRegister as string,
        agenda.configuration.participant.canRegisterUntil.end
      )
    );
  });
  const projectsMe = computed<IProject[]>(() => {
    return user.value?.member.projects || [];
  });
  const { data: dataAspirations, refresh: aspirationsRefresh } =
    useLazyAsyncData("aspirations-me", () =>
      $api<IAspirationMeResponse>("/api/me/aspirations")
    );
  const { data: dataPoints, refresh: pointsRefresh } = useLazyAsyncData(
    "points",
    () => $api("/api/point")
  );
  const aspirations = computed<IAspiration[]>(
    () => dataAspirations.value?.data?.aspiration || []
  );
  const points = computed<IPoint[]>(() => dataPoints.value?.data?.points || []);
  const all = computed<number>(() => {
    return (
      agendasMe.value?.committees?.length! +
      agendasMe.value?.members?.length! +
      projectsMe.value.length!
    );
  });
  const allCanMeRegister = computed<number>(() => {
    return agendasCanMeRegistered.value?.length!;
  });
  return {
    agendasMe,
    projectsMe,
    allCanMeRegister,
    all,
    aspirations,
    points,
    aspirationsRefresh,
    pointsRefresh,
    agendasCanMeRegistered,
  };
};
