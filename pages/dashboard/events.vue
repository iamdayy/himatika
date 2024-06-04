<script setup lang='ts'>
import type { IEvent, IProfile } from "~/types";
const { $toast } = useNuxtApp()
definePageMeta({
    middleware: "auth"
})
useHead({
    title: "Dashboard | Himatika"
});

const { canMeRegister } = useCanMeRegister();


const { user } = useAuth();

const { events, refreshEvents } = useEvents();
const { isDept } = useDept();
const { isAdmin } = useRole();

const selectedRegistered = ref<Array<any>>([]);

const registerForm = ref({
    NIM: user.value?.profile.NIM,
    id: ""
})

const Event = ref<IEvent | null>(null);
const event = computed<IEvent | null>({
    get() {
        if (Event.value) {
            return Event.value;
        }
        return null;
    },
    set(newVal) {
        Event.value = newVal
    }
})
const pickDetail = (id: string) => {
    if (events.value) {
        const index = events.value.findIndex((event) => event.title === id);
        Event.value = events.value[index];
    }
}

const pickDay = (day: any) => {
    pickDate.value = day.day;
}
const pickDate = ref<number | null>(null);

const attributes = computed(() => [
    ...<[]>events.value?.map(event => ({
        dot: 'green',
        content: 'green',
        dates: event.date,
        popover: {
            label: event.title
        }
    }))
]);


const isMeRegistered = (event: IEvent) => {
    const nim = user.value?.profile.NIM;
    const found = event.registered?.find((registered) => (registered.profile as IProfile).NIM == nim);
    if (!found) {
        return false;
    } else {
        return true;
    }
}

const register = async (id: string) => {
    registerForm.value.id = id;
    try {
        const response = await $fetch("/api/event/register", {
            method: "post",
            body: registerForm.value
        });
        refreshEvents();
        $toast(response.statusMessage!);
    } catch (error: any) {
        $toast("Failed to register " + Event.value?.title);
    }
}
</script>
<template>
    <div class="items-center justify-center mb-24 ">
        <div class="mx-auto text-center">
            <h2 class="text-4xl font-extrabold leading-tight tracking-tight text-gray-600 dark:text-white">
                Agenda
            </h2>
        </div>
        <CoreCard class="mt-6">
            <ModalsEventsAdd @trigger-refresh="refreshEvents" v-if="isAdmin || isDept" />
            <div class="flex flex-col w-full gap-3 px-8 py-12 md:flex-row">
                <VCalendar :attributes="attributes" class="mx-auto shadow-lg md:max-w-sm" transparent
                    @dayclick="pickDay" :is-dark="{ selector: ':root', darkClass: 'dark' }">
                    <template #footer>
                        <div class="px-2 pb-3">
                            <div class="mx-auto">
                                <div class="pt-2 border-t border-gray-800 dark:border-gray-700">
                                    <div v-for="event, i in events?.filter((event: IEvent) => new Date(event.date).getDate() == pickDate)"
                                        :key="i"
                                        class="flex flex-col gap-2 px-4 py-2 cursor-pointer sm:gap-6 sm:flex-row sm:items-center hover:bg-gray-200 rounded-3xl"
                                        @click="pickDetail(event.title)">
                                        <p
                                            class="text-sm font-normal text-gray-500 sm:text-right dark:text-gray-400 shrink-0">
                                            {{ `${new Date(event.date).getHours()}:${new Date(event.date).getMinutes()}`
                                            }}
                                        </p>
                                        <h3 class="text-lg font-semibold text-gray-600 dark:text-white">
                                            {{ event.title }}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </VCalendar>
                <div class="w-full px-8 py-4 bg-gray-100 border border-gray-400 rounded-lg shadow-lg dark:bg-gray-800">
                    <h5 v-if="!Event"
                        class="my-24 mb-4 text-3xl font-semibold text-center text-yellow-300 dark:text-yellow-200">No
                        Agenda
                        Selected</h5>
                    <div v-else>
                        <div class="flex justify-between w-full">
                            <h5 class="mb-4 text-2xl font-medium text-gray-500 dark:text-gray-400">{{ Event?.title }}
                            </h5>
                            <ModalsEventsEdit :identifier="Event._id as string" @trigger-refresh="refreshEvents"
                                v-if="isAdmin || isDept" />
                        </div>
                        <ul role="list" class="space-y-5 my-7">
                            <li class="flex items-center">
                                <Icon name="solar:calendar-outline"
                                    class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                                <span
                                    class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                        new Date(Event.date).toLocaleDateString() }}</span>
                            </li>
                            <li class="flex items-center">
                                <Icon name="solar:clock-circle-outline"
                                    class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                                <span
                                    class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                        new Date(Event?.date).toLocaleTimeString() }}</span>
                            </li>
                            <li class="flex">
                                <Icon name="solar:map-point-outline"
                                    class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                                <span
                                    class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                        Event?.at }}</span>
                            </li>
                            <li class="flex">
                                <Icon name="solar:eye-outline"
                                    class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                                <span
                                    class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                        Event?.canSee }}</span>
                            </li>
                            <li class="flex">
                                <Icon name="solar:document-outline"
                                    class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                                <span
                                    class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                        Event?.description }}</span>
                            </li>
                            <li v-if="Event.committee">
                                <span class="flex">
                                    <Icon name="solar:users-group-two-rounded-outline"
                                        class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                                    <span
                                        class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">
                                        Committee</span>
                                </span>
                                <div class="relative my-3 mt-6 overflow-auto sm:rounded-lg ms-8 max-h-48 no-scrollbar">
                                    <table
                                        class="w-full text-sm text-left text-gray-500 bg-gray-100 rtl:text-right dark:text-gray-400 dark:bg-gray-700">
                                        <tbody>
                                            <tr v-for="event, i in Event.committee">
                                                <td class="px-6 py-4 border-gray-200 border-e dark:border-gray-600">
                                                    {{ (event.user as IProfile).fullName }}
                                                </td>
                                                <td class="px-6 py-4 border-gray-200 border-e dark:border-gray-600">
                                                    as
                                                </td>
                                                <td class="px-6 py-4">
                                                    {{ event.job }}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </li>
                            <li v-if="Event.registered">
                                <CoreModal name="Registered">
                                    <div class="px-2 py-2">
                                        <table
                                            class="w-full text-sm text-left text-gray-500 rtl:text-right dark:text-gray-400">
                                            <thead
                                                class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                                <tr>
                                                    <th scope="col" class="p-4">
                                                        <div class="flex items-center">
                                                            <input id="checkbox-all-search" type="checkbox"
                                                                :checked="selectedRegistered.length == Event.registered?.length"
                                                                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                                                            <label for="checkbox-all-search"
                                                                class="sr-only">checkbox</label>
                                                        </div>
                                                    </th>
                                                    <th scope="col" class="px-6 py-3">
                                                        Name
                                                    </th>
                                                    <th scope="col" class="px-6 py-3">
                                                        NIM
                                                    </th>
                                                    <th scope="col" class="px-6 py-3">
                                                        Class
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                                                    v-for="registered, i in Event.registered" :key="i">
                                                    <td class="w-4 p-4">
                                                        <div class="flex items-center">
                                                            <input id="checkbox-table" type="checkbox"
                                                                v-model="selectedRegistered"
                                                                :value="(registered?.profile as IProfile)"
                                                                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded checkbox-table focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                                                            <label for="checkbox-table" class="sr-only">checkbox</label>
                                                        </div>
                                                    </td>
                                                    <th scope="row"
                                                        class="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap dark:text-white">
                                                        <NuxtImg class="rounded-full"
                                                            :src="(registered?.profile as IProfile).avatar || '/profile-blank.png'"
                                                            sizes="40" alt="Jese image" />
                                                        <div class="ps-3">
                                                            <div class="text-base font-semibold">{{
                                                                (registered?.profile as IProfile).fullName }}</div>
                                                            <div class="font-normal text-gray-500">{{
                                                                (registered?.profile as IProfile).email
                                                            }}</div>
                                                        </div>
                                                    </th>
                                                    <td class="px-6 py-4">
                                                        {{ (registered?.profile as IProfile).NIM }}
                                                    </td>
                                                    <td class="px-6 py-4">
                                                        <div class="flex items-center">
                                                            {{ (registered?.profile as IProfile).class }}
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </CoreModal>
                            </li>
                        </ul>
                        <button type="submit"
                            v-if="canMeRegister(Event.canRegister, Event.date) && !isMeRegistered(Event)"
                            @click="register(Event?._id as string)"
                            class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                            Register this
                        </button>
                    </div>
                </div>
            </div>
        </CoreCard>
    </div>
</template>
<style scoped></style>