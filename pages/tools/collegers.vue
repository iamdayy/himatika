<script setup lang='ts'>
import type { IProfile } from '~/types';

const { $toast } = useNuxtApp();
definePageMeta({
    middleware: "auth"
});
useHead({
    title: "Data Mahasiswa | Himatika"
});


const { access: canAccessAdd, role } = useRole(["Secretary", "viceSecretary"]);

const { data: collegers, refresh } = await useAsyncData(() => $fetch<IProfile[]>("/api/profile"));

const selectedCollegers = ref<IProfile[]>([]);

const checkAll = () => {
    if (selectedCollegers.value?.length == collegers.value?.length) {
        selectedCollegers.value = [];
    } else {
        selectedCollegers.value = collegers.value!;
    }
}

</script>
<template>
    <div class="max-w-6xl mx-auto overflow-x-auto shadow-md sm:rounded-lg px-2.5 py-3">
        <div
            class="flex flex-wrap items-center justify-between py-4 space-y-4 bg-white flex-column md:flex-row md:space-y-0 dark:bg-gray-900">
            <div class="flex flex-wrap items-center space-x-4">
                <ModalsCollegersAdd @trigger-refresh="refresh" v-if="canAccessAdd" />
                <!--  -->
                <!--  -->
                <ModalsCollegersExport @trigger-refresh="refresh" v-if="canAccessAdd" />
            </div>
            <label for="table-search" class="sr-only">Search</label>
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
                    placeholder="Search for collegers">
            </div>
        </div>
        <table class="w-full text-sm text-left text-gray-500 rtl:text-right dark:text-gray-400">
            <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                    <th scope="col" class="p-4">
                        <div class="flex items-center">
                            <input id="checkbox-all-search" type="checkbox" @change="checkAll" :checked="selectedCollegers.length == collegers?.length"
                                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                            <label for="checkbox-all-search" class="sr-only">checkbox</label>
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
                    <th scope="col" class="px-6 py-3">
                        
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    v-for="colleger, i in collegers" :key="i">
                    <td class="w-4 p-4">
                        <div class="flex items-center">
                            <input id="checkbox-table" type="checkbox" v-model="selectedCollegers" :value="colleger"
                                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded checkbox-table focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                            <label for="checkbox-table" class="sr-only">checkbox</label>
                        </div>
                    </td>
                    <th scope="row" class="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap dark:text-white">
                        <NuxtImg class="rounded-full w-14" :src="colleger?.avatar || '/img/profile-blank.png'" sizes="40px"
                            alt="Jese image" />
                        <div class="ps-3">
                            <div class="text-base font-semibold">{{ colleger.fullName }}</div>
                            <div class="font-normal text-gray-500">{{ colleger.email }}</div>
                        </div>
                    </th>
                    <td class="px-6 py-4">
                        {{ colleger.NIM }}
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex items-center">
                            {{ colleger.class }}
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <ModalCollegersUpdate :data="colleger" />
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
<style scoped></style>