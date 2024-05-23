import type { IEvent, TRole } from "~/types";

export const useEvents = () => {
    const { canMeRegister } = useCanMeRegister()
    const { data: events, refresh: refreshEvents } = useAsyncData(() => $api<IEvent[]>("/api/event"));
    const { data: me } = useAuth()
    const eventsMe = computed<IEvent[]>(() => {
        return me.value?.profile.events;
    })
    const eventsCanMeRegistered = computed<IEvent[]|undefined>(() => {
        return events.value?.filter((event) => canMeRegister(event.canRegister, event.date));
    })
    return {
        events,
        eventsMe,
        eventsCanMeRegistered,
        refreshEvents
    }
}