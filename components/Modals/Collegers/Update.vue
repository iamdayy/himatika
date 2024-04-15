<script setup lang='ts'>
import { Modal } from 'flowbite';
import type { ModalOptions, ModalInterface } from 'flowbite';
import type { InstanceOptions } from 'flowbite';
import type { IProfile } from '~/types';

const { $toast } = useNuxtApp();

const emit = defineEmits(["triggerRefresh"]);

const { data } = defineProps({
    data: {
        type: Object as PropType<IProfile>,
        required: true
    }
});

const colleger = ref<IProfile>(data)

const updateColleger = async () => {
    try {
        const updated = await $fetch("/api/profile", {
            method: "PUT",
            body: colleger.value,
            query: {
                NIM: colleger.value.NIM
            }
        });
        const modalElement: HTMLElement = document.querySelector('#editCollegerModal-' + colleger.value.NIM) as HTMLElement;
        const instanceOptions: InstanceOptions = {
            id: 'editCollegerModal-' + colleger.value.NIM,
            override: true
        };
        const modal: ModalInterface = new Modal(modalElement, {}, instanceOptions);
        $toast(updated.statusMessage!);
        modal.hide();
        emit("triggerRefresh");
    } catch (error) {
        $toast("Failed to update Colleger");
    }
}
</script>
<template>
    <!-- Modal toggle -->
    <button :data-modal-target="`editCollegerModal-${colleger.NIM}`"
        :data-modal-show="`editCollegerModal-${colleger.NIM}`"
        class="font-medium text-blue-600 dark:text-blue-500 hover:underline">
        <Icon name="solar:pen-new-square-outline" sizes="12"></Icon>
    </button>
    <!-- Edit colleger modal -->
    <div :id="`editCollegerModal-${colleger.NIM}`" tabindex="-1" aria-hidden="true"
        class="fixed top-0 left-0 right-0 z-50 items-center justify-center hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full">
        <div class="relative w-full max-w-2xl max-h-full">
            <!-- Modal content -->
            <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
                <!-- Modal header -->
                <div class="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-600">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                        Edit colleger
                    </h3>
                    <button type="button"
                        class="inline-flex items-center justify-center w-8 h-8 text-sm text-gray-400 bg-transparent rounded-lg hover:bg-gray-200 hover:text-gray-900 ms-auto dark:hover:bg-gray-600 dark:hover:text-white"
                        :data-modal-hide="`editCollegerModal-${colleger.NIM}`">
                        <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 14 14">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                        </svg>
                        <span class="sr-only">Close modal</span>
                    </button>
                </div>
                <!-- Modal body -->
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
                                    {{ new Date(colleger.birth.date).toLocaleDateString() }}
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
                                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Full
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
                    <button type="submit" @click="updateColleger"
                        class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                        Save
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped></style>