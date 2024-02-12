<script setup lang='ts'>
import type { IEvent } from "~/types"
import * as changeCase from "change-case";
useHead({
    title: "Dashboard | Himatika"
});
const Events = ref<IEvent[]>([
    {
        title: "Musyawarah Besar",
        date: new Date(2024, 1, 10),
        description: "Bahas Ngidul Ngalor",
        committee: {
            chief: "Jackson",
            viceChief: "Andreas",
            secretary: "Hilda",
            viceSecretary: "Dephay",
            treasurer: "Emma Watson",
            viceTreasurer: "Siri"
        }
    }
]);

const Event = ref<IEvent | null>(null);
const pickDetail = (id: number) => {
    Event.value = Events.value[id];
}

const pickDay = (day: any) => {
    pickDate.value = day.date;
}
const pickDate = ref<Date | null>(null);

const attributes = ref([
    {
        dot: true,
        dates: [
            ...Events.value.map((event) => event.date)
        ],
    },
]);
</script>
<template>
    <div class=" justify-center items-center mb-24">
        <div class="mx-auto text-center">
            <h2 class="text-4xl font-extrabold leading-tight tracking-tight text-gray-600 dark:text-white">
                Agenda
            </h2>
            <div class="mt-4">
                <button
                    class="inline-flex items-center text-lg font-medium text-gray-100 bg-green-500 hover:bg-green-400 px-4 rounded-full py-2">
                    Add Agenda
                </button>
            </div>
        </div>
        <div class="flex py-4 px-8 gap-3 w-full">
            <VCalendar :attributes="attributes" class="shadow-lg max-w-sm" @dayclick="pickDay">
                <template #footer>
                    <div class="px-2 pb-3">
                        <div class="mx-auto">
                            <div class="divide-y divide-gray-400 dark:divide-gray-700">
                                <div v-for="event, i in Events.filter((event) => event.date.getDate() == pickDate?.getDate())"
                                    :key="i" class="flex flex-col gap-2 py-4 px-2 sm:gap-6 sm:flex-row sm:items-center cursor-pointer hover:bg-gray-200 rounded-3xl"
                                    @click="pickDetail(i)">
                                    <p class="text-sm font-normal text-gray-500 sm:text-right dark:text-gray-400 shrink-0">
                                        {{ event.date.toLocaleTimeString() }}
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
            <div class="w-full bg-gray-100 border border-gray-400 rounded-lg shadow-lg px-8 py-4">
                <h5 v-if="!Event"
                    class="mb-4 text-center my-24 text-3xl font-semibold text-yellow-300 dark:text-yellow-200">No Agenda
                    Selected</h5>
                <div v-else>
                    <h5 class="mb-4 text-2xl font-medium text-gray-500 dark:text-gray-400">{{ Event?.title }}</h5>
                    <ul role="list" class="space-y-5 my-7">
                        <li class="flex items-center">
                            <Icon name="solar:calendar-outline"
                                class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                            <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                Event?.date.toDateString() }}</span>
                        </li>
                        <li class="flex items-center">
                            <Icon name="solar:clock-circle-outline"
                                class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                            <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                Event?.date.toLocaleTimeString() }}</span>
                        </li>
                        <li class="flex">
                            <Icon name="solar:document-outline"
                                class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                            <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                Event?.description }}</span>
                        </li>
                        <li v-if="Event.committee">
                            <span class="flex">
                                <Icon name="solar:users-group-two-rounded-outline"
                                    class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                                <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">
                                    Committee</span>
                            </span>
                            <dl
                                class="space-y-3 my-3 mt-6 ps-8 list-inside divide-y divide-gray-200 dark:text-white dark:divide-gray-700">
                                <div v-for="[i,v] in Object.entries(Event.committee!)" class="flex flex-col">
                                    <dt class="mb-1 text-gray-500 text-sm dark:text-gray-400">{{ changeCase.capitalCase(i) }}</dt>
                                    <dd class="text-lg font-medium text-gray-500 dark:text-gray-400">{{ v }}</dd>
                                </div>
                        </dl>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</div></template>
<style scoped></style>