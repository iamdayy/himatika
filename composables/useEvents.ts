import type { IEvent, TRole } from "~/types";

export const useEvents = () => {
    const { canMeRegister } = useCanMeRegister()
    const { data: events, refresh: refreshEvents } = useAsyncData(() => $api<IEvent[]>("/api/event"));
    const { data: me } = useAuth()
    const eventsMe = me.value?.profile.events;
    const eventsCanMeRegistered = events.value?.filter((event) => canMeRegister(event.canRegister));
    return {
        events,
        eventsMe,
        eventsCanMeRegistered,
        refreshEvents
    }
}