<script setup lang='ts'>
import { Modal } from 'flowbite';
import type { ModalOptions, ModalInterface } from 'flowbite';
import type { InstanceOptions } from 'flowbite';
import type { IProfile } from '~/types';

const { $toast } = useNuxtApp();

const emit = defineEmits(["triggerRefresh"])

const selectedCollegers = ref<IProfile[]>([]);


const DataFromCSV = ref<IProfile[] | null>(null);

const checkAll = () => {
    if (selectedCollegers.value?.length == DataFromCSV.value?.length) {
        selectedCollegers.value = [];
    } else {
        selectedCollegers.value = DataFromCSV.value!;
    }
}

const getCollegersFromCSV = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const uploaded = await $fetch("/api/profile/batchFileUpload", {
        method: "POST",
        body: form
    });
    DataFromCSV.value = uploaded;
}

const addCollegers = async () => {
    try {
        const added = await $fetch("/api/profile/batch", {
            method: "post",
            body: selectedCollegers.value
        });
        const modalElement: HTMLElement = document.querySelector('#import-csv-file') as HTMLElement;
        const instanceOptions: InstanceOptions = {
            id: 'import-csv-file',
            override: true
        };
        const modal: ModalInterface = new Modal(modalElement, {}, instanceOptions);
        $toast(added.statusMessage);
        modal.hide();
        emit("triggerRefresh");
    } catch (error) {
        $toast("Failed to add new Collegers");
    }
}
</script>
<template>
    <!-- Add From CSV -->
    <!--  -->
    <!--  -->
    <CoreModal name="import-csv-file">
        <CoreDropFile @change="getCollegersFromCSV" />
        <div class="w-full p-2 mx-auto my-3 text-center">
            <a href="/template/template.csv" target="_blank" download
                class="w-full mx-auto text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                Download Template
            </a>
        </div>
        <table class="w-full text-sm text-left text-gray-500 rtl:text-right dark:text-gray-400">
            <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                    <th scope="col" class="p-4">
                        <div class="flex items-center">
                            <input id="checkbox-all-search" type="checkbox" @change="checkAll"
                                :checked="selectedCollegers.length == DataFromCSV?.length"
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
                </tr>
            </thead>
            <tbody>
                <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    v-for="colleger, i in DataFromCSV" :key="i">
                    <td class="w-4 p-4">
                        <div class="flex items-center">
                            <input id="checkbox-table" type="checkbox" v-model="selectedCollegers" :value="colleger"
                                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded checkbox-table focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                            <label for="checkbox-table" class="sr-only">checkbox</label>
                        </div>
                    </td>
                    <th scope="row" class="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap dark:text-white">
                        <NuxtImg class="rounded-full" :src="colleger?.avatar || '/profile-blank.png'" sizes="40"
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
                </tr>
            </tbody>
        </table>
        <div class="w-full p-2">
            <button type="submit" @click="addCollegers"
                class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                Add Checked Collegers
            </button>
        </div>
    </CoreModal>
</template>
<style scoped></style>