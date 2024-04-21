<script setup lang='ts'>
import { Modal } from 'flowbite';
import type { ModalOptions, ModalInterface } from 'flowbite';
import type { InstanceOptions } from 'flowbite';
import type { IProject, IProfile } from '~/types';

const { data: profiles } = await useAsyncData(() => $fetch<IProfile[]>("/api/profile"));
const { $toast } = useNuxtApp();

const emit = defineEmits(["triggerRefresh"]);

const project = ref<IProject>({
    title: "",
    deadline: new Date(),
    description: "",
    hidden: false,
    contributors: [
        {
            profile: 0,
            job: ""
        }
    ]
});

const getNameFromNIM = (NIM?: number) => {
    return profiles.value?.find((profile) => profile.NIM == NIM)?.fullName;
}

const addProject = async () => {
    try {
        const added = await $fetch("/api/project", {
            method: "POST",
            body: project.value
        });

        const modalElement: HTMLElement = document.querySelector('#add-project-modal') as HTMLElement;
        const instanceOptions: InstanceOptions = {
            id: 'add-project-modal',
            override: true
        };
        const modal: ModalInterface = new Modal(modalElement, {}, instanceOptions);
        $toast(added.statusMessage!);
        modal.hide();
        emit("triggerRefresh");
    } catch (error) {
        $toast("Failed to add new Projects");
    }
};


const addContributors = () => {
    if (!project.value.contributors) {
        project.value.contributors = [
            {
                job: "",
                profile: 0
            }
        ]
    } else {
        project.value.contributors?.push({
            job: "",
            profile: 0
        });
    }
}

const deleteContributors = (i: number) => {
    project.value.contributors?.splice(i, 1);
}
</script>
<template>
    <CoreModal name="add-project">
        <div class="p-6 space-y-6 text-start">
            <div class="grid grid-cols-6 gap-6">
                <div class="col-span-6 sm:col-span-3">
                    <label for="Title"
                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Title</label>
                    <input type="text" name="Title" id="Title"
                        class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Project 1" v-model="project.title" required>
                </div>
                <div class="col-span-6 sm:col-span-3">
                    <label for="deadline"
                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Deadline</label>
                    <div class="flex gap-3 p-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-500">
                        <VDatePicker id="deadline" v-model="project.deadline" mode="date">
                            <template #default="{ togglePopover }">
                                <button @click="togglePopover">
                                    <Icon name="solar:calendar-date-outline"
                                        class="w-6 h-6 mx-2 text-gray-400 hover:text-blue-600" />
                                </button>
                            </template>
                        </VDatePicker>
                        <label class="block my-auto text-sm font-medium text-gray-900 dark:text-white" for="deadline">
                            {{ project.deadline.toLocaleDateString() }}
                        </label>
                    </div>
                </div>
                <div class="col-span-6">
                    <label for="description"
                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Description</label>
                    <textarea id="description" rows="6" v-model="project.description"
                        class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"></textarea>
                </div>
                <div class="col-span-6">
                    <label for="contributors"
                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Contributors</label>
                    <div id="contributors" class="ms-2">
                        <div v-for="contributors, i in project.contributors" :key="i" class="flex mb-2">
                            <div class="flex items-center w-full gap-2">
                                <div class="w-3/4">
                                    <label :for="`${contributors.job}-job`"
                                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Job</label>
                                    <input :type="`${contributors.job}-job`" :name="`${contributors.job}-job`"
                                        :id="`${contributors.job}-job`" v-model="project.contributors![i].job"
                                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                                        required>
                                </div>
                                <div class="w-1/4">
                                    <label :for="`${contributors.job}-profile`"
                                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">NIM</label>
                                    <input :type="`${contributors.job}-profile`" :name="`${contributors.job}-profile`"
                                        :id="`${contributors.job}-profile`" v-model="project.contributors![i].profile"
                                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                                        required>
                                </div>
                            </div>
                            <button @click="deleteContributors(i)" class="font-medium rounded-lg text-2xl px-5 py-2.5 text-center inline-flex items-end">
                                <Icon name="solar:trash-bin-trash-outline" class="text-red-500" />
                            </button>
                        </div>
                        <button @click="addContributors"
                            class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                            Add Contributors
                            <Icon name="solar:user-plus-outline" class="w-3.5 h-3.5 ms-2" />
                        </button>
                    </div>
                </div>
            </div>
            <button type="submit" @click="addProject"
                class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                Add New Project
            </button>
        </div>
    </CoreModal>
</template>
<style scoped></style>