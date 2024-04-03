<script setup lang='ts'>
import { Modal } from 'flowbite';
import type { ModalOptions, ModalInterface } from 'flowbite';
import type { InstanceOptions } from 'flowbite';
import type { IProfile } from '~/types';
const { $toast } = useNuxtApp();
definePageMeta({
    middleware: "auth"
});
useHead({
    title: "Data Mahasiswa | Himatika"
})
const { data: collegers, refresh } = await useAsyncData(() => $fetch<IProfile[]>("/api/profile"));
const colleger = ref<IProfile>({
    fullName: "",
    NIM: 0,
    email: "",
    phone: "",
    avatar: "/profile-blank.png",
    religion: "",
    sex: "Laki-Laki",
    birth: {
        place: "",
        date: new Date()
    },
    citizen: "",
    address: {
        fullAddress: "",
        village: "",
        district: "",
        city: "",
        province: "",
        country: "",
        zip: 0o0
    },
    class: "",
    semester: 1,
    isRegistered: false
});
const addColleger = async () => {
    try {
        const added = await $fetch("/api/profile", {
            method: "post",
            body: colleger.value
        });
        const modalElement: HTMLElement = document.querySelector('#add-colleger-modal') as HTMLElement;
        const instanceOptions: InstanceOptions = {
            id: 'add-colleger-modal',
            override: true
        };
        const modal: ModalInterface = new Modal(modalElement, {}, instanceOptions);
        $toast(`Success add ${colleger.value.fullName} to collegers`);
        modal.hide();
        refresh();
    } catch (error) {
        $toast("Failed to add new Colleger");
    }
}
</script>
<template>
    <div class="max-w-6xl mx-auto overflow-x-auto shadow-md sm:rounded-lg px-2.5 py-3">
        <div
            class="flex flex-wrap items-center justify-between py-4 space-y-4 bg-white flex-column md:flex-row md:space-y-0 dark:bg-gray-900">
            <div>
                <CoreModal name="add-colleger">
                    <div class="p-6 space-y-6">
                        <div class="grid grid-cols-6 gap-6">
                            <div class="col-span-6">
                                <label for="fullName"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Full
                                    Name</label>
                                <input type="text" name="fullName" id="fullName"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="Andrea" v-model="colleger.fullName" required>
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label for="email"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
                                <input type="email" name="email" id="email"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="example@company.com" v-model="colleger.email" required>
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label for="phone-number"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Phone
                                    Number</label>
                                <input type="text" name="phone-number" id="phone-number"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="e.g. +(12)3456 789" v-model="colleger.phone" required>
                            </div>
                            <div class="col-span-6 sm:col-span-6">
                                <label for="birth"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Birth</label>
                                <div class="flex">
                                    <input type="text" name="birth" id="birth"
                                        class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                        placeholder="Jakarta" v-model="colleger.birth.place" required>
                                    <VDatePicker id="date" v-model="colleger.birth.date" mode="date">
                                        <template #default="{ togglePopover }">
                                            <button @click="togglePopover">
                                                <Icon name="solar:calendar-date-outline"
                                                    class="w-6 h-6 mx-2 text-gray-400 hover:text-blue-600" />
                                            </button>
                                        </template>
                                    </VDatePicker>
                                    <label class="block my-auto text-sm font-medium text-gray-900 dark:text-white">
                                        {{ colleger.birth.date.toLocaleDateString() }}
                                    </label>
                                </div>
                            </div>
                            <div class="col-span-3 sm:col-span-2">
                                <label for="sex"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Sex</label>
                                <input type="text" name="sex" id="sex"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="Laki-Laki" v-model="colleger.sex" required>
                            </div>
                            <div class="col-span-3 sm:col-span-2">
                                <label for="religion"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Religion</label>
                                <input type="text" name="religion" id="religion"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="Islam" v-model="colleger.religion" required>
                            </div>
                            <div class="col-span-6 sm:col-span-2">
                                <label for="citizen"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Citizen</label>
                                <input type="text" name="citizen" id="citizen"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="indonesia" v-model="colleger.citizen" required>
                            </div>
                            <!--  -->
                            <!--  -->
                            <!-- Address Section -->
                            <!--  -->
                            <!--  -->
                            <div class="inline-flex items-center justify-center w-full col-span-6">
                                <hr class="w-full h-px my-2 bg-gray-800 border-0 dark:bg-gray-700">
                                <span
                                    class="absolute px-3 font-medium text-gray-900 -translate-x-1/2 bg-white left-1/2 dark:text-white dark:bg-gray-900">Address</span>
                            </div>
                            <div class="col-span-6">
                                <label for="full-address"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Full Address</label>
                                    <textarea id="full-address" rows="4" class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="e.g jl.kebayoran lama no. 32" required></textarea>
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label for="village"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Village</label>
                                <input type="text" name="village" id="village"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="Paesan" v-model="colleger.address.village" required>
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label for="district"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">District</label>
                                <input type="text" name="district" id="district"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="Kedungwuni" v-model="colleger.address.district" required>
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label for="city"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">City</label>
                                <input type="text" name="city" id="city"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="Pekalongan" v-model="colleger.address.city" required>
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label for="province"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Province</label>
                                <input type="text" name="province" id="province"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="Jawa Tengah" v-model="colleger.address.province" required>
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label for="country"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Country</label>
                                <input type="text" name="country" id="country"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="indonesia" v-model="colleger.address.country" required>
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label for="zip"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Zip Code</label>
                                <input type="number" name="zip" id="zip"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="31100" v-model="colleger.address.zip" required>
                            </div>
                            <!--  -->
                            <!--  -->
                            <!-- Academic Section -->
                            <!--  -->
                            <!--  -->
                            <div class="inline-flex items-center justify-center w-full col-span-6">
                                <hr class="w-full h-px my-2 bg-gray-800 border-0 dark:bg-gray-700">
                                <span
                                    class="absolute px-3 font-medium text-gray-900 -translate-x-1/2 bg-white left-1/2 dark:text-white dark:bg-gray-900">Academic</span>
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label for="NIM"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">NIM</label>
                                <input type="number" name="NIM" id="NIM"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="10220023" v-model="colleger.NIM" required>
                            </div>
                            <div class="col-span-3 sm:col-span-1">
                                <label for="semester"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Semester</label>
                                <input type="number" name="semester" id="semester"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="1" v-model="colleger.semester" required>
                            </div>
                            <div class="col-span-3 sm:col-span-2">
                                <label for="class"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Class</label>
                                <input type="text" name="class" id="class"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="IM24A" v-model="colleger.class" required>
                            </div>
                        </div>
                        <button type="submit" @click="addColleger"
                            class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                            Add New Colleger
                        </button>
                    </div>
                </CoreModal>
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
                            <input id="checkbox-all-search" type="checkbox"
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
                        Action
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    v-for="colleger, i in collegers" :key="i">
                    <td class="w-4 p-4">
                        <div class="flex items-center">
                            <input id="checkbox-table-search-1" type="checkbox"
                                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                            <label for="checkbox-table-search-1" class="sr-only">checkbox</label>
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
                    <td class="px-6 py-4">
                        <!-- Modal toggle -->
                        <a href="#" type="button" data-modal-target="editCollegerModal"
                            data-modal-show="editCollegerModal"
                            class="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit colleger</a>
                    </td>
                </tr>
            </tbody>
        </table>
        <!-- Edit colleger modal -->
        <div id="editCollegerModal" tabindex="-1" aria-hidden="true"
            class="fixed top-0 left-0 right-0 z-50 items-center justify-center hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full">
            <div class="relative w-full max-w-2xl max-h-full">
                <!-- Modal content -->
                <form class="relative bg-white rounded-lg shadow dark:bg-gray-700">
                    <!-- Modal header -->
                    <div class="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-600">
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                            Edit colleger
                        </h3>
                        <button type="button"
                            class="inline-flex items-center justify-center w-8 h-8 text-sm text-gray-400 bg-transparent rounded-lg hover:bg-gray-200 hover:text-gray-900 ms-auto dark:hover:bg-gray-600 dark:hover:text-white"
                            data-modal-hide="editCollegerModal">
                            <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
                                viewBox="0 0 14 14">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                                    stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                            </svg>
                            <span class="sr-only">Close modal</span>
                        </button>
                    </div>
                    <!-- Modal body -->
                    <div class="p-6 space-y-6">
                        <div class="grid grid-cols-6 gap-6">
                            <div class="col-span-6 sm:col-span-3">
                                <label for="first-name"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">First
                                    Name</label>
                                <input type="text" name="first-name" id="first-name"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="Bonnie" required>
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label for="last-name"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Last
                                    Name</label>
                                <input type="text" name="last-name" id="last-name"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="Green" required>
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label for="email"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
                                <input type="email" name="email" id="email"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="example@company.com" required>
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label for="phone-number"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Phone
                                    Number</label>
                                <input type="number" name="phone-number" id="phone-number"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="e.g. +(12)3456 789" required>
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label for="department"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Department</label>
                                <input type="text" name="department" id="department"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="Development" required>
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label for="company"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Company</label>
                                <input type="number" name="company" id="company"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="123456" required>
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label for="current-password"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Current
                                    Password</label>
                                <input type="password" name="current-password" id="current-password"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="••••••••" required>
                            </div>
                            <div class="col-span-6 sm:col-span-3">
                                <label for="new-password"
                                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">New
                                    Password</label>
                                <input type="password" name="new-password" id="new-password"
                                    class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="••••••••" required>
                            </div>
                        </div>
                    </div>
                    <!-- Modal footer -->
                    <div
                        class="flex items-center p-6 space-x-3 border-t border-gray-200 rounded-b rtl:space-x-reverse dark:border-gray-600">
                        <button type="submit"
                            class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Save
                            all</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
<style scoped></style>