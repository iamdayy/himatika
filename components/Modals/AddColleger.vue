<script setup lang='ts'>
import { Modal } from 'flowbite';
import type { ModalOptions, ModalInterface } from 'flowbite';
import type { InstanceOptions } from 'flowbite';
import type { IProfile } from '~/types';

const { $toast } = useNuxtApp();

const emit = defineEmits(["triggerRefresh"]);

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
        $toast(added.statusMessage!);
        modal.hide();
        emit("triggerRefresh");
    } catch (error) {
        $toast("Failed to add new Colleger");
    }
}
</script>
<template>
    <!-- Add Collegers -->
    <!--  -->
    <!--  -->
    <CoreModal name="add-colleger">
        <div class="p-6 space-y-6">
            <div class="grid grid-cols-6 gap-6">
                <div class="col-span-6">
                    <label for="fullName" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Full
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
                    <label for="phone-number" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Phone
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
                    <label for="sex" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Sex</label>
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
                    <label for="full-address" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Full
                        Address</label>
                    <textarea id="full-address" rows="4" v-model="colleger.address.fullAddress"
                        class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="e.g jl.kebayoran lama no. 32" required></textarea>
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
                    <label for="city" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">City</label>
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
                    <label for="zip" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Zip
                        Code</label>
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
                    <label for="NIM" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">NIM</label>
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
</template>
<style scoped></style>