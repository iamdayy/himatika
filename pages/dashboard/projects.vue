<script setup lang='ts'>
import type { IProject } from '~/types';
const Projects = ref<IProject[]>([
    {
        id: 1,
        title: "Himatika Webapp",
        deadline: new Date("20 May 2024"),
        description: "lorem ipsum",
        hidden: true,
        contributors: [
            {
                name: "Andreas",
                job: "Project Manager"
            }
        ]
    },
    {
        id: 2,
        title: "Simitnu Redesign",
        deadline: new Date("20 May 2025"),
        description: "lorem ipsum",
        hidden: true,
        contributors: [
            {
                name: "Jean",
                job: "Project Manager"
            }
        ]
    },
]);
const Project = ref<IProject|null>(null);
const pickDetail = (id: number) => {
    const index = Projects.value.findIndex((project) => project.id === id);
    Project.value = Projects.value[index];
}
useHead({
    title: "Projects | Himatika"
});
definePageMeta({
  middleware: "auth"
});
</script>
<template>
    <div class="items-center justify-center pb-24">
        <div class="mx-auto text-center">
            <h2 class="text-4xl font-extrabold leading-tight tracking-tight text-gray-600 dark:text-white">
                Project
            </h2>
            <div class="mt-4">
                <CoreModal name="Add Project">
                    <div class="px-2 py-4 text-start">
                    </div>
                </CoreModal>
            </div>
        </div>
        <div class="flex flex-col w-full gap-3 px-8 py-12 md:flex-row">
            <div class="mx-auto shadow-lg rounded-lg w-full md:w-2/5 max-h-[60vh] overflow-y-scroll border border-gray-400 bg-gray-100 py-4 no-scrollbar">
                <button
                v-for="project,i in Projects" :key="i"
                @click="pickDetail(project.id)"
                    class="relative inline-flex items-center w-full px-4 py-2 text-sm font-medium border-b border-gray-200 rounded-t-lg hover:bg-gray-100 hover:text-blue-700 focus:border-blue-700 focus:z-10 focus:text-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:text-white">
                    {{ project.title }} | {{ project.deadline.toDateString() }}
                </button>
            </div>
            <div class="w-full px-8 py-4 bg-gray-100 border border-gray-400 rounded-lg shadow-lg">
                <h5 v-if="!Project"
                    class="my-24 mb-4 text-3xl font-semibold text-center text-yellow-300 dark:text-yellow-200">No Project
                    Selected</h5>
                <div v-else>
                    <h5 class="mb-4 text-2xl font-medium text-gray-500 dark:text-gray-400">{{ Project?.title }}</h5>
                    <ul role="list" class="space-y-5 my-7">
                        <li class="flex items-center">
                            <Icon name="solar:calendar-outline"
                                class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                            <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                Project?.deadline.toDateString() }}</span>
                        </li>
                        <li class="flex items-center">
                            <Icon name="solar:clock-circle-outline"
                            class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                            <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                Project?.deadline.toLocaleTimeString() }}</span>
                        </li>
                        <li class="flex">
                            <Icon name="solar:lock-keyhole-unlocked-outline"
                                class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                            <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                Project?.hidden }}</span>
                        </li>
                        <li class="flex">
                            <Icon name="solar:document-outline"
                                class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                            <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                Project?.description }}</span>
                        </li>
                        <li v-if="Project.contributors">
                            <span class="flex">
                                <Icon name="solar:users-group-two-rounded-outline"
                                    class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                                <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">
                                    Contributors</span>
                            </span>
                            <dl
                                class="my-3 mt-6 space-y-3 list-inside divide-y divide-gray-200 ps-8 dark:text-white dark:divide-gray-700">
                                <div v-for="project, i in Project.contributors" class="flex flex-col" :key="i">
                                    <dt class="mb-1 text-sm text-gray-500 dark:text-gray-400">{{ project.job
                                    }}</dt>
                                    <dd class="text-lg font-medium text-gray-500 dark:text-gray-400">{{ project.name }}</dd>
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