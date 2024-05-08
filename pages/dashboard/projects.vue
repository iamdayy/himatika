<script setup lang='ts'>
import { initPopovers } from 'flowbite';
import type { IProfile, IProject, TRole } from '~/types';

const { access: canAccessAdd, isAdmin } = useRole(["Secretary", "viceSecretary", "Chairman"]);
const { isDept } = useDept();
const { data } = useAuth();
const { $toast } = useNuxtApp();

const { data: Projects, refresh } = useAsyncData(() => $fetch<IProject[]>("/api/project"));

const Project = ref<IProject | null>(null);
const registerForm = ref({
    NIM: data.value?.profile.NIM,
    task: "",
    id: 0
})
const pickDetail = (title: string) => {
    const index = Projects.value?.findIndex((project) => project.title === title);
    Project.value = Projects.value![index!];
}

const canMeRegister = (canRegister: TRole) => {
    switch (canRegister) {
        case "All":
            return true;
            break;
        case "No":
            return false;
            break;
        case "Admin":
            if (isAdmin) {
                return true;
                break;
            } else {
                return false;
                break;
            }
        case "Departement":
            if (isDept) {
                return true;
                break;
            } else {
                return false;
                break;
            }
        case "Internal":
            if (isAdmin || isDept) {
                return true;
                break;
            } else {
                return false;
                break;
            }
        case "External":
            if (!isAdmin || !isDept) {
                return true;
                break;
            } else {
                return false;
                break;
            }
        default:
            return false;
            break;
    }
}

const isMeRegistered = (project: IProject) => {
    const nim = data.value?.profile.NIM;
    const found = project.registered?.find((registered) => (registered.profile as IProfile).NIM == nim);
    if (!found) {
        return false;
    } else {
        return true;
    }
}
const register = async (id: number) => {
    registerForm.value.id = id;
    try {
        const response = await $fetch("/api/project/register", {
            method: "post",
            body: registerForm.value
        });
        refresh();
        $toast(response.statusMessage!);
    } catch (error: any) {
        $toast("Failed to register " + Project.value?.title);
    }
}
useHead({
    title: "Projects | Himatika"
});
definePageMeta({
    middleware: "auth"
});
onMounted(() => {
    initPopovers();
});
</script>
<template>
    <div class="items-center justify-center pb-24">
        <div class="mx-auto text-center">
            <h2 class="text-4xl font-extrabold leading-tight tracking-tight text-gray-600 dark:text-white">
                Project
            </h2>
            <ModalsProjectsAdd @trigger-refresh="refresh" v-if="canAccessAdd" />
        </div>
        <div class="flex flex-col w-full gap-3 px-8 py-12 md:flex-row">
            <div
                class="mx-auto shadow-lg rounded-lg w-full md:w-2/5 max-h-[60vh] overflow-y-scroll border border-gray-400 bg-gray-100 py-4 no-scrollbar">
                <button v-for="project, i in Projects" :key="i" @click="pickDetail(project.title)"
                    class="relative inline-flex items-center w-full px-4 py-2 text-lg font-semibold border-b border-gray-200 rounded-t-lg hover:bg-gray-100 hover:text-blue-700 focus:border-blue-700 focus:z-10 focus:text-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:text-white">
                    {{ project.title }} | <span class="font-light text-md ms-2">{{ new
                        Date(project.deadline).toDateString() }}</span>
                </button>
            </div>
            <div class="w-full px-8 py-4 bg-gray-100 border border-gray-400 rounded-lg shadow-lg">
                <h5 v-if="!Project"
                    class="my-24 mb-4 text-3xl font-semibold text-center text-yellow-300 dark:text-yellow-200">No
                    Project
                    Selected</h5>
                <div v-else>
                    <h5 class="mb-4 text-2xl font-medium text-gray-500 dark:text-gray-400">{{ Project?.title }}</h5>
                    <ul role="list" class="space-y-5 my-7">
                        <li class="flex items-center">
                            <Icon name="solar:calendar-outline"
                                class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                            <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                new Date(Project?.deadline).toDateString() }}</span>
                        </li>
                        <li class="flex">
                            <Icon name="solar:eye-outline"
                                class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                            <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                Project?.canSee }}</span>
                        </li>
                        <li class="flex">
                            <Icon name="solar:user-plus-outline"
                                class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                            <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                Project?.canRegister }}</span>
                        </li>
                        <li class="flex">
                            <Icon name="solar:pen-new-square-outline"
                                class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                            <div class="flex flex-wrap gap-2">
                                <span v-for="task, i in Project.tasks" :key="i" id="badge-dismiss-default"
                                    class="inline-flex items-center px-2 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded me-2 dark:bg-blue-900 dark:text-blue-300">
                                    {{ task }}
                                </span>
                            </div>
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
                                    <dd class="text-lg font-medium text-gray-500 dark:text-gray-400">{{
                                        (project.profile as IProfile).fullName
                                        }}</dd>
                                </div>
                            </dl>
                        </li>
                        <li v-if="Project.registered">
                            <span class="flex">
                                <Icon name="solar:users-group-two-rounded-outline"
                                    class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                                <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">
                                    Registered</span>
                            </span>
                            <dl
                                class="my-3 mt-6 space-y-3 list-inside divide-y divide-gray-200 ps-8 dark:text-white dark:divide-gray-700">
                                <div v-for="project, i in Project.registered" class="flex flex-col" :key="i">
                                    <dt class="mb-1 text-sm text-gray-500 dark:text-gray-400">{{ project.task
                                        }}</dt>
                                    <dd class="text-lg font-medium text-gray-500 dark:text-gray-400">{{
                                        (project.profile as IProfile).fullName
                                        }}</dd>
                                </div>
                            </dl>
                        </li>
                    </ul>
                    <button type="submit" v-if="canMeRegister(Project.canRegister) && !isMeRegistered(Project)" data-popover-target="register" data-popover-placement="bottom" data-popover-trigger="click"
                        class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                        Register this
                    </button>
                    <div data-popover id="register" role="tooltip"
                        class="absolute z-10 invisible inline-block w-64 text-sm text-gray-500 transition-opacity duration-300 bg-white border border-gray-200 rounded-lg shadow-sm opacity-0 dark:text-gray-400 dark:border-gray-600 dark:bg-gray-800">
                        <div
                            class="px-3 py-2 bg-gray-300 border-b border-gray-200 rounded-t-lg dark:border-gray-600 dark:bg-gray-700">
                            <h3 class="font-semibold text-gray-800 dark:text-white">Register</h3>
                        </div>
                        <div class="px-3 py-2">
                            <FormSelect title="Task" :options="Project.tasks" v-model="registerForm.task"></FormSelect>
                            <button type="submit" @click="register(Project?._id!)"
                                class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                                Register this
                            </button>
                        </div>
                        <div data-popper-arrow></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped></style>