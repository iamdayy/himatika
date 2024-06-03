<script setup lang='ts'>
import type { InstanceOptions, ModalInterface } from 'flowbite';
import { Modal, initPopovers } from 'flowbite';
import type { IProject } from '~/types';
import type { IProfileResponse } from '~/types/IResponse';

const { data } = await useAsyncData(() => $api<IProfileResponse>("/api/profile"));
const { $toast } = useNuxtApp();

const emit = defineEmits(["triggerRefresh"]);
const props = defineProps({
    identifier: String,
})
const { data: proj, refresh } = await useAsyncData(() => $api<IProject>("/api/project", {
    method: "get",
    query: {
        id: props.identifier
    }
}))

const project = computed<IProject>(() => {
    if (!proj.value) {
        return {
            title: "",
            deadline: new Date(),
            description: "",
            canSee: "All",
            canRegister: "No",
            registered: [],
            tasks: [],
            contributors: [
                {
                    profile: 0,
                    job: ""
                }
            ]
        }
    }
    return proj.value
});

const getNameFromNIM = (NIM?: number) => {
    return data.value?.profiles.find((profile) => profile.NIM == NIM)?.fullName;
}

const editProject = async () => {
    try {
        const added = await $api("/api/project", {
            method: "put",
            query: {
                id: project.value?._id
            },
            body: project.value
        });

        const modalElement: HTMLElement = document.querySelector('#modal-edit-project') as HTMLElement;
        const instanceOptions: InstanceOptions = {
            id: 'modal-edit-project',
            override: true
        };
        const modal: ModalInterface = new Modal(modalElement, {}, instanceOptions);
        $toast(added.statusMessage!);
        modal.hide();
        emit("triggerRefresh");
    } catch (error) {
        $toast(`Failed to edit ${project.value?.title} Project`);
    }
};


const addContributors = () => {
    if (!project.value?.contributors) {
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

const addNewTask = (ev: any) => {
    const newTask = ev.target.value;
    project.value.tasks?.push(newTask);
}

const deleteTask = (i: number) => {
    project.value?.tasks?.splice(i, 1);
}

const deleteContributors = (i: number) => {
    project.value?.contributors?.splice(i, 1);
}

onMounted(() => {
    initPopovers();
})
</script>
<template>
    <CoreModal @onShow="refresh()" name="edit-project">
        <template #trigger="{ show }">
            <button type="button" @click="show()"
                class="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white">
                <Icon name="solar:pen-new-square-outline" class="w-6 h-6" />
                <span class="sr-only">Edit Project</span>
            </button>
        </template>
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
                            {{ new Date(project.deadline).toLocaleDateString() }}
                        </label>
                    </div>
                </div>
                <div class="col-span-6">
                    <label for="description"
                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Description</label>
                    <textarea id="description" rows="6" v-model="project.description"
                        class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"></textarea>
                </div>
                <div class="col-span-4">
                    <label for="contributors"
                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Contributors</label>
                    <div id="contributors" class="ms-2">
                        <div v-for="contributors, i in project.contributors" :key="i" class="mb-2">
                            <div class="flex">
                                <div class="flex items-center w-full gap-2">
                                    <div class="w-3/4">
                                        <label :for="`${contributors.job}-job`"
                                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Job</label>
                                        <input :type="`${contributors.job}-job`" :name="`${contributors.job}-job`"
                                            :id="`${contributors.job}-job`" v-model="project.contributors![i].job"
                                            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                                            required>
                                    </div>
                                    <!-- input is an object -->
                                    <!--  -->
                                    <!--  -->
                                    <!--  -->
                                    <div class="w-1/4">
                                        <label :for="`${contributors.job}-profile`"
                                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">NIM</label>
                                        <input :type="`${contributors.job}-profile`"
                                            :name="`${contributors.job}-profile`" :id="`${contributors.job}-profile`"
                                            v-model="project.contributors![i].profile"
                                            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                                            required>
                                    </div>
                                </div>
                                <button @click="deleteContributors(i)"
                                    class="font-medium rounded-lg text-2xl px-5 py-2.5 text-center inline-flex items-end">
                                    <Icon name="solar:trash-bin-trash-outline" class="text-red-500" />
                                </button>
                            </div>
                            <label :for="`${contributors.job}-profile`"
                                class="block text-sm font-medium text-gray-900 dark:text-white">{{
                                    getNameFromNIM(project.contributors![i].profile as number) }}</label>
                        </div>
                        <button @click="addContributors"
                            class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                            Add Contributors
                            <Icon name="solar:user-plus-outline" class="w-3.5 h-3.5 ms-2" />
                        </button>
                    </div>
                </div>
                <div class="col-span-2">
                    <div class="mb-2">
                        <FormSelect title="Can See" :options="['Admin', 'Departement', 'Internal', 'All', 'External']"
                            v-model="project.canSee"></FormSelect>
                    </div>
                    <div class="mb-2">
                        <FormSelect title="Can Register"
                            :options="['Admin', 'Departement', 'Internal', 'All', 'External', 'No']"
                            v-model="project.canRegister"></FormSelect>
                    </div>
                    <div class="mb-2">
                        <label for="select-tasks"
                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Tasks</label>
                        <div class="flex flex-wrap gap-2">
                            <span v-for="task, i in project.tasks" :key="i" id="badge-dismiss-default"
                                class="inline-flex items-center px-2 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded me-2 dark:bg-blue-900 dark:text-blue-300">
                                {{ task }}
                                <button type="button" @click="deleteTask(i)"
                                    class="inline-flex items-center p-1 text-sm text-blue-400 bg-transparent rounded-sm ms-2 hover:bg-blue-200 hover:text-blue-900 dark:hover:bg-blue-800 dark:hover:text-blue-300"
                                    data-dismiss-target="#badge-dismiss-default" aria-label="Remove">
                                    <svg class="w-2 h-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                                        fill="none" viewBox="0 0 14 14">
                                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                                            stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                                    </svg>
                                    <span class="sr-only">Remove badge</span>
                                </button>
                            </span>

                            <button data-popover-target="edit-new-task" data-popover-placement="bottom"
                                data-popover-trigger="click" type="button"
                                class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm px-1.5 py-1.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                                <Icon name="solar:pen-new-round-outline" size="1.5em" />
                            </button>

                            <div data-popover id="edit-new-task" role="tooltip"
                                class="absolute z-10 invisible inline-block w-64 text-sm text-gray-500 transition-opacity duration-300 bg-white border border-gray-200 rounded-lg shadow-sm opacity-0 dark:text-gray-400 dark:border-gray-600 dark:bg-gray-800">
                                <div
                                    class="px-3 py-2 bg-gray-300 border-b border-gray-200 rounded-t-lg dark:border-gray-600 dark:bg-gray-700">
                                    <h3 class="font-semibold text-gray-800 dark:text-white">Add New Task</h3>
                                </div>
                                <div class="px-3 py-2">
                                    <input type="text" name="Task" id="Task"
                                        class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                        placeholder="task..." @change="addNewTask" required>
                                </div>
                                <div data-popper-arrow></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <button type="submit" @click="editProject"
                class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                Edit {{ project.title }} Project
            </button>
        </div>
    </CoreModal>
</template>
<style scoped></style>