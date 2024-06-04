<script setup lang='ts'>
import type { InstanceOptions, ModalInterface } from 'flowbite';
import { Modal } from "flowbite";
import type { IEvent } from '~/types';
import type { IProfileResponse } from '~/types/IResponse';

const { $toast } = useNuxtApp();
const { data: profile } = await useAsyncData(() => $api<IProfileResponse>("/api/profile"));

const emits = defineEmits(['trigger-refresh']);

const newEvent = ref<IEvent>({
    title: "",
    date: new Date(),
    at: "",
    description: "",
    canSee: "All",
    committee: [
        {
            job: "chief",
            user: ""
        }
    ],
    canRegister: "No"
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

const addEvent = async () => {
    try {
        const added = await $api("/api/event", {
            method: "post",
            body: newEvent.value,
        });
        const modalElement: HTMLElement = document.querySelector('#modal-add-agenda') as HTMLElement;
        const instanceOptions: InstanceOptions = {
            id: 'modal-add-agenda',
            override: true
        };
        const modal: ModalInterface = new Modal(modalElement, {}, instanceOptions);
        $toast("Success add new event at " + new Date(newEvent.value.date).toLocaleDateString());
        emits('trigger-refresh');
        modal.hide();
    } catch (error: any) {
        $toast("Failed to add new Event");
    }
}

const getNameFromNIM = (NIM?: number) => {
    return profile.value?.profiles.find((profile) => profile.NIM == NIM)?.fullName;
}
</script>
<template>
    <CoreModal name="add-agenda">
        <div class="px-2 py-4 text-start">
            <div class="space-y-4">
                <div class="grid grid-cols-6 gap-6 px-4">
                    <div class="col-span-6">
                        <label for="title"
                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Title</label>
                        <input type="title" name="title" id="title" v-model="newEvent.title"
                            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                            required>
                    </div>
                    <div class="col-span-3">
                        <label for="date" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Date
                            & Time</label>
                        <VDatePicker id="date" v-model="newEvent.date" mode="dateTime">
                            <template #default="{ togglePopover }">
                                <button class="px-3 py-2 text-sm font-semibold text-white bg-blue-500 rounded-md"
                                    @click="togglePopover">
                                    Select date
                                </button>
                            </template>
                        </VDatePicker>
                    </div>
                    <div class="col-span-3">
                        <label for="at" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">At</label>
                        <input type="at" name="at" id="at" v-model="newEvent.at"
                            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                            required>
                    </div>
                    <div class="col-span-3">
                        <FormSelect title="Can See" :options="['Admin', 'Departement', 'Internal', 'All', 'External']"
                            v-model="newEvent.canSee"></FormSelect>
                    </div>
                    <div class="col-span-3">
                        <FormSelect title="Can Register"
                            :options="['Admin', 'Departement', 'Internal', 'All', 'External', 'No']"
                            v-model="newEvent.canRegister"></FormSelect>
                    </div>
                    <div class="col-span-6">
                        <label for="description"
                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Description</label>
                        <textarea id="description" rows="4"
                            class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"></textarea>
                    </div>
                    <div class="col-span-6">
                        <label for="committee"
                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Contributors</label>
                        <div id="committee" class="ms-2">
                            <div v-for="committee, i in newEvent.committee" :key="i" class="mb-2">
                                <div class="flex">
                                    <div class="flex items-center w-full gap-2">
                                        <div class="w-3/4">
                                            <label :for="`${committee.job}-job`"
                                                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Job</label>
                                            <input :type="`${committee.job}-job`" :name="`${committee.job}-job`"
                                                :id="`${committee.job}-job`" v-model="newEvent.committee![i].job"
                                                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                                                required>
                                        </div>
                                        <div class="w-1/4">
                                            <label :for="`${committee.job}-profile`"
                                                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">NIM</label>
                                            <input :type="`${committee.job}-profile`" :name="`${committee.job}-profile`"
                                                :id="`${committee.job}-profile`" v-model="newEvent.committee![i].user"
                                                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                                                required>
                                        </div>
                                    </div>
                                    <button @click="deleteCommittee(i)"
                                        class="font-medium rounded-lg text-2xl px-5 py-2.5 text-center inline-flex items-end">
                                        <Icon name="solar:trash-bin-trash-outline" class="text-red-500" />
                                    </button>
                                </div>
                                <label :for="`${committee.job}-profile`"
                                    class="block text-sm font-medium text-gray-900 dark:text-white">{{
                                        getNameFromNIM(newEvent.committee![i].user as number) }}</label>
                            </div>
                            <button @click="addCommittee"
                                class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                                Add Committee
                                <Icon name="solar:user-plus-outline" class="w-3.5 h-3.5 ms-2" />
                            </button>
                        </div>
                    </div>
                </div>
                <button type="submit" @click.prevent="addEvent"
                    class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                    Create Agenda
                </button>
            </div>
        </div>
    </CoreModal>
</template>
<style scoped></style>