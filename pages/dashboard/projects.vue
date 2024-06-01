<script setup lang='ts'>
import { Popover, initPopovers } from 'flowbite';
import type { IProfile, IProject } from '~/types';

const { isAdmin } = useRole(["Secretary", "viceSecretary", "Chairman"]);
const { isDept } = useDept();
const { user } = useAuth();
const { $toast } = useNuxtApp();

const { page, perPage, projects, totalProjects, refreshProjects } = useProjects()
page.value = 1;
perPage.value = 10;
const { canMeRegister } = useCanMeRegister();

const selectedRegistered = ref<Array<any>>([]);

const Project = ref<IProject | null>(null);
const registerForm = ref({
    NIM: user.value?.profile.NIM,
    task: "",
    id: 0
});
const clickpage = (v: number) => {
    page.value = v;
    refreshProjects();
}
const pickDetail = (title: string) => {
    const index = projects.value?.findIndex((project) => project.title === title);
    Project.value = projects.value![index!];
}

const isMeRegistered = (project: IProject) => {
    const nim = user.value?.profile.NIM;
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
        refreshProjects();
        $toast(response.statusMessage!);
    } catch (error: any) {
        $toast("Failed to register " + Project.value?.title);
    }
}


let popover: Popover;

useHead({
    title: "Projects | Himatika"
});
definePageMeta({
    middleware: "auth"
});
onMounted(() => {
    initPopovers();
    const $targetEl = document.getElementById(`content`);
    const $triggerEl = document.getElementById(`button`);
    if ($targetEl && $triggerEl) {
        popover = new Popover($targetEl, $triggerEl, {
            placement: "top",
            triggerType: "click",
            offset: 10
        });
    }
});
</script>
<template>
    <div class="items-center justify-center pb-24">
        <div class="mx-auto text-center">
            <h2 class="text-4xl font-extrabold leading-tight tracking-tight text-gray-600 dark:text-white">
                Project
            </h2>
        </div>
        <CoreCard class="mt-6">
            <div class="flex flex-row-reverse justify-between px-8">
                <ModalsProjectsAdd @trigger-refresh="refreshProjects" v-if="isAdmin || isDept" />
                <div class="relative">
                    <div class="absolute inset-y-0 flex items-center pointer-events-none rtl:inset-r-0 start-0 ps-3">
                        <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                        </svg>
                    </div>
                    <input type="text" id="table-search-collegers"
                        class="block pt-2 text-sm text-gray-900 border border-gray-300 rounded-lg ps-10 w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Search project">
                </div>
            </div>
            <div class="flex flex-col w-full gap-3 px-8 py-12 md:flex-row">
                <div
                    class="mx-auto shadow-lg rounded-lg w-full md:w-2/5 max-h-[60vh] overflow-y-auto border border-gray-400 bg-gray-100 py-4 dark:bg-gray-800">
                    <button v-for="project, i in projects" :key="i" @click="pickDetail(project.title)"
                        class="relative inline-flex items-center w-full px-4 py-2 text-lg font-semibold border-b border-gray-200 rounded-t-lg hover:bg-gray-100 hover:text-blue-700 focus:border-blue-700 focus:z-10 focus:text-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-white dark:focus:text-white">
                        {{ project.title }} | <span class="font-light text-md ms-2">{{ new
                            Date(project.deadline).toDateString() }}</span>
                    </button>
                    <CorePagination v-if="page" :total="totalProjects!" v-model="perPage" :current-page="page"
                        @pagechanged="clickpage" />
                </div>
                <div class="w-full px-8 py-4 bg-gray-100 border border-gray-400 rounded-lg shadow-lg dark:bg-gray-800">
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
                                <span
                                    class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                        new Date(Project?.deadline).toDateString() }}</span>
                            </li>
                            <li class="flex">
                                <Icon name="solar:eye-outline"
                                    class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                                <span
                                    class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                        Project?.canSee }}</span>
                            </li>
                            <li class="flex">
                                <Icon name="solar:user-plus-outline"
                                    class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                                <span
                                    class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                        Project?.canRegister }}</span>
                            </li>
                            <li class="flex">
                                <Icon name="solar:pen-new-square-outline"
                                    class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                                <div class="flex flex-wrap gap-2 ms-3">
                                    <span v-for="task, i in Project.tasks" :key="i" id="badge-dismiss-default"
                                        class="inline-flex items-center px-2 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded me-2 dark:bg-blue-900 dark:text-blue-300">
                                        {{ task }}
                                    </span>
                                </div>
                            </li>
                            <li class="flex">
                                <Icon name="solar:document-outline"
                                    class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                                <span
                                    class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                                        Project?.description }}</span>
                            </li>
                            <li v-if="Project.contributors">
                                <span class="flex">
                                    <Icon name="solar:users-group-two-rounded-outline"
                                        class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                                    <span
                                        class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">
                                        Contributors</span>
                                </span>
                                <div class="relative my-3 mt-6 overflow-auto sm:rounded-lg ms-8 max-h-[40vh]">
                                    <table
                                        class="w-full text-sm text-left text-gray-500 bg-gray-100 rtl:text-right dark:text-gray-400 dark:bg-gray-700">
                                        <tbody>
                                            <tr v-for="event, i in Project.contributors">
                                                <td class="px-6 py-4 border-gray-200 border-e dark:border-gray-600">
                                                    {{ (event.profile as IProfile).fullName }}
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
                            <li v-if="Project.registered">
                                <CoreModal name="Registered">
                                    <div class="px-2 py-2 relative overflow-auto sm:rounded-lg max-h-[40vh]">
                                        <table
                                            class="w-full text-sm text-left text-gray-500 rtl:text-right dark:text-gray-400">
                                            <thead
                                                class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                                <tr>
                                                    <th scope="col" class="p-4">
                                                        <div class="flex items-center">
                                                            <input id="checkbox-all-search" type="checkbox"
                                                                :checked="selectedRegistered.length == Project.registered?.length"
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
                                                    v-for="registered, i in Project.registered" :key="i">
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
                        <CorePopover name="Register"
                            v-if="canMeRegister(Project.canRegister, Project.deadline) && !isMeRegistered(Project)">
                            <FormSelect title="Task" :options="Project.tasks" v-model="registerForm.task">
                            </FormSelect>
                            <button type="submit" @click="register(Project?._id!)"
                                class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                                Register this
                            </button>
                        </CorePopover>
                    </div>
                </div>
            </div>
        </CoreCard>
    </div>
</template>
<style scoped></style>