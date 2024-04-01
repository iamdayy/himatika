<script setup lang='ts'>
import type { IEvent } from "~/types"
import { Modal } from "flowbite"
import type { ModalOptions, ModalInterface } from 'flowbite';
import type { InstanceOptions } from 'flowbite';
const { $toast } = useNuxtApp()
definePageMeta({
    middleware: "auth"
})
useHead({
    title: "Dashboard | Himatika"
});
const { data: Events, refresh } = await useAsyncData(() => $fetch<IEvent[]>("/api/event"));
const Event = ref<IEvent | null>(null);
const newEvent = ref<IEvent>({
    title: "",
    date: new Date(),
    at: "",
    description: "",
    accessbility: "",
    committee: [
        {
            job: "chief",
            user: ""
        }
    ]
});

const addCommittee = () => {
    if (!newEvent.value.committee) {
        newEvent.value.committee = [
            {
                job: "",
                user: ""
            }
        ]
    } else {
        newEvent.value.committee?.push({
            job: "",
            user: ""
        });
    }
}

const deleteCommittee = (i: number) => {
    newEvent.value.committee?.splice(i, 1);
}
const pickDetail = (id: string) => {
    if (Events.value) {
        const index = Events.value.findIndex((event) => event.title === id);
        Event.value = Events.value[index];
    }
}

const pickDay = (day: any) => {
    pickDate.value = day.day;
}
const pickDate = ref<number | null>(null);

const attributes = ref([
    {
        dot: true,
        dates: Events.value?.map<Date>((event) => event.date),
    },
]);

const addEvent = async () => {
    try {
        const added = await $fetch("/api/event", {
            method: "post",
            body: newEvent.value
        });
        const modalElement: HTMLElement = document.querySelector('#add-agenda-modal') as HTMLElement;
        const instanceOptions: InstanceOptions = {
            id: 'add-agenda-modal',
            override: true
        };
        const modal: ModalInterface = new Modal(modalElement, {}, instanceOptions);
        $toast("Success add new event at " + newEvent.value.date.toLocaleDateString());
        modal.hide();
        refresh();
    } catch (error: any) {
        $toast("Failed to add new Event");
    }
}
</script>
<template>
    <div class="items-center justify-center mb-24 ">
        <div class="mx-auto text-center">
            <h2 class="text-4xl font-extrabold leading-tight tracking-tight text-gray-600 dark:text-white">
                Agenda
            </h2>
            <div class="mt-4">
                <CoreModal name="add-agenda">
                    <div class="px-2 py-4 text-start">
                        <form class="space-y-4">
                            <div>
                                <label for="title"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Title</label>
                                <input type="title" name="title" id="title" v-model="newEvent.title"
                                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                                    required>
                            </div>
                            <div>
                                <label for="date"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Date
                                    & Time</label>
                                <VDatePicker id="date" v-model="newEvent.date" mode="dateTime">
                                    <template #default="{ togglePopover }">
                                        <button
                                            class="px-3 py-2 text-sm font-semibold text-white bg-blue-500 rounded-md"
                                            @click="togglePopover">
                                            Select date
                                        </button>
                                    </template>
                                </VDatePicker>
                            </div>
                            <div>
                                <label for="at"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">At</label>
                                <input type="at" name="at" id="at" v-model="newEvent.at"
                                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                                    required>
                            </div>
                            <div>
                                <label for="accessbility"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Accessbility</label>
                                <input type="accessbility" name="accessbility" id="accessbility"
                                    v-model="newEvent.accessbility"
                                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                                    required>
                            </div>
                            <div>
                                <label for="description"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Description</label>
                                <textarea id="description" rows="4"
                                    class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"></textarea>
                            </div>
                            <div>
                                <label for="committee"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Committe</label>
                                <div id="committee" class="ms-2">
                                    <div v-for="committee, i in newEvent.committee" :key="i"
                                        class="flex justify-between mb-2">
                                        <div class="flex w-full gap-2">
                                            <div>
                                                <label :for="`${committee.job}-job`"
                                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Job</label>
                                                <input :type="`${committee.job}-job`" :name="`${committee.job}-job`"
                                                    :id="`${committee.job}-job`" v-model="newEvent.committee[i].job"
                                                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                                                    required>
                                            </div>
                                            <div>
                                                <label :for="`${committee.job}-name`"
                                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Name</label>
                                                <input :type="`${committee.job}-name`" :name="`${committee.job}-name`"
                                                    :id="`${committee.job}-name`" v-model="newEvent.committee[i].user"
                                                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                                                    required>
                                            </div>
                                        </div>
                                        <button @click="deleteCommittee(i)">
                                            <Icon name="solar:trash-bin-trash-outline" class="text-red-500" />
                                        </button>
                                    </div>
                                    <button @click="addCommittee"
                                        class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                                        Add Committee
                                        <Icon name="solar:user-plus-outline" class="w-3.5 h-3.5 ms-2" />
                                    </button>
                                </div>
                            </div>
                            <button type="submit" @click.prevent="addEvent"
                                class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                                Create Agenda
                            </button>
                        </form>
                    </div>
                </CoreModal>
            </div>
        </div>
        <div class="flex flex-col w-full gap-3 px-8 py-12 md:flex-row">
            <VCalendar :attributes="attributes" class="mx-auto shadow-lg md:max-w-sm" @dayclick="pickDay">
                <template #footer>
                    <div class="px-2 pb-3">
                        <div class="mx-auto">
                            <div class="pt-2 border-t border-gray-800 dark:border-gray-700">
                                <div v-for="event, i in Events?.filter((event: IEvent) => new Date(event.date).getDate() == pickDate)"
                                    :key="i"
                                    class="flex flex-col gap-2 px-4 py-2 cursor-pointer sm:gap-6 sm:flex-row sm:items-center hover:bg-gray-200 rounded-3xl"
                                    @click="pickDetail(event.title)">
                                    <p
                                        class="text-sm font-normal text-gray-500 sm:text-right dark:text-gray-400 shrink-0">
                                        {{ `${new Date(event.date).getHours()}:${new Date(event.date).getMinutes()}` }}
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
            <div class="w-full px-8 py-4 bg-gray-100 border border-gray-400 rounded-lg shadow-lg">
                <h5 v-if="!Event"
                    class="my-24 mb-4 text-3xl font-semibold text-center text-yellow-300 dark:text-yellow-200">No
                    Agenda
                    Selected</h5>
                <div v-else>
                    <h5 class="mb-4 text-2xl font-medium text-gray-500 dark:text-gray-400">{{ Event?.title }}</h5>
                    <ul role="list" class="space-y-5 my-7">
                        <li class="flex items-center">
                            <Icon name="solar:calendar-outline"
                                class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                            <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                    Event?.date }}</span>
                        </li>
                        <li class="flex items-center">
                            <Icon name="solar:clock-circle-outline"
                                class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                            <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                    Event?.date }}</span>
                        </li>
                        <li class="flex">
                            <Icon name="solar:map-point-outline"
                                class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                            <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                    Event?.at }}</span>
                        </li>
                        <li class="flex">
                            <Icon name="solar:lock-keyhole-unlocked-outline"
                                class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                            <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                    Event?.accessbility }}</span>
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
                                class="my-3 mt-6 space-y-3 list-inside divide-y divide-gray-200 ps-8 dark:text-white dark:divide-gray-700">
                                <div v-for="event, i in Event.committee" class="flex flex-col" :key="i">
                                    <dt class="mb-1 text-sm text-gray-500 dark:text-gray-400">{{ event.job
                                        }}</dt>
                                    <dd class="text-lg font-medium text-gray-500 dark:text-gray-400">{{
                                    event.user.fullName }}
                                    </dd>
                                </div>
                            </dl>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped></style>