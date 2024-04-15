<script setup lang='ts'>
import { Modal } from 'flowbite';
import type { ModalOptions, ModalInterface } from 'flowbite';
import type { InstanceOptions } from 'flowbite';
import type { IAdministrator, IProfile } from '~/types';

const { data: profiles } = await useAsyncData<IProfile[]>(() => $fetch("/api/profile"))
const { $toast } = useNuxtApp();

const emit  = defineEmits(["triggerRefresh"]);

const administrator = ref<IAdministrator>({
    chairman: 0,
    viceChairman: 0,
    secretary: 0,
    viceSecretary: 0,
    treasurer: 0,
    viceTreasurer: 0,
    period: {
        start: new Date(),
        end: new Date()
    }
});

const getNameFromNIM =  (NIM?: number) => {
    return profiles.value?.find((profile) => profile.NIM == NIM)?.fullName;
}

const addAdministrator = async () => {
    try {
        const added = await $fetch("/api/administrator", {
            method: "POST",
            body: administrator.value
        });
        
        const modalElement: HTMLElement = document.querySelector('#add-administrator-modal') as HTMLElement;
        const instanceOptions: InstanceOptions = {
            id: 'add-administrator-modal',
            override: true
        };
        const modal: ModalInterface = new Modal(modalElement, {}, instanceOptions);
        $toast(added.statusMessage!);
        modal.hide();
        emit("triggerRefresh");
    } catch (error) {
        $toast("Failed to add new Administrators");
    }
};
</script>
<template>
    <CoreModal name="add-administrator">
        <div class="p-6 space-y-6">
            <div class="grid grid-cols-6 gap-6">
                <div class="col-span-6 sm:col-span-3">
                    <label for="Chairman"
                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Chairman</label>
                        <input type="number" name="Chairman" id="Chairman"
                        class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="102240033" v-model="administrator.chairman" required>
                        <label for="Chairman"
                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{{ getNameFromNIM(administrator.chairman as number) }}</label>
                </div>
                <div class="col-span-6 sm:col-span-3">
                    <label for="viceChairman" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Vice
                        Chairman</label>
                        <input type="number" name="viceChairman" id="viceChairman"
                        class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="102240033" v-model="administrator.viceChairman" required>
                        <label for="viceChairman" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{{ getNameFromNIM(administrator.viceChairman as number) }}</label>
                </div>
                <div class="col-span-6 sm:col-span-3">
                    <label for="Secretary"
                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Secretary</label>
                        <input type="number" name="Secretary" id="Secretary"
                        class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="102240033" v-model="administrator.secretary" required>
                        <label for="Secretary"
                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{{ getNameFromNIM(administrator.secretary as number) }}</label>
                </div>
                <div class="col-span-6 sm:col-span-3">
                    <label for="viceSecretary" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Vice
                        Secretary</label>
                        <input type="number" name="viceSecretary" id="viceSecretary"
                        class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="102240033" v-model="administrator.viceSecretary" required>
                        <label for="viceSecretary" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{{ getNameFromNIM(administrator.viceSecretary as number) }}</label>
                </div>
                <div class="col-span-6 sm:col-span-3">
                    <label for="Treasurer"
                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Treasurer</label>
                        <input type="number" name="Treasurer" id="Treasurer"
                        class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="102240033" v-model="administrator.treasurer" required>
                        <label for="Treasurer"
                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{{ getNameFromNIM(administrator.treasurer as number) }}</label>
                </div>
                <div class="col-span-6 sm:col-span-3">
                    <label for="viceTreasurer"
                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">viceTreasurer</label>
                        <input type="number" name="viceTreasurer" id="viceTreasurer"
                        class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="102240033" v-model="administrator.viceTreasurer" required>
                        <label for="viceTreasurer"
                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{{ getNameFromNIM(administrator.viceTreasurer as number) }}</label>
                </div>
                <div class="col-span-3">
                    <label for="start"
                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Start</label>
                        <div class="flex gap-3 p-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-500">
                            <VDatePicker id="start" v-model="administrator.period.start" mode="date">
                                <template #default="{ togglePopover }">
                                    <button @click="togglePopover">
                                        <Icon name="solar:calendar-date-outline"
                                            class="w-6 h-6 mx-2 text-gray-400 hover:text-blue-600" />
                                    </button>
                                </template>
                            </VDatePicker>
                            <label class="block my-auto text-sm font-medium text-gray-900 dark:text-white" for="start">
                                {{ administrator.period.start.toLocaleDateString() }}
                            </label>
                        </div>
                </div>
                <div class="col-span-3">
                    <label for="end" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">End</label>
                    <div class="flex gap-2 p-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-500">
                        <VDatePicker id="end" v-model="administrator.period.end" mode="date">
                            <template #default="{ togglePopover }">
                                <button @click="togglePopover">
                                    <Icon name="solar:calendar-date-outline"
                                        class="w-6 h-6 mx-2 text-gray-400 hover:text-blue-600" />
                                </button>
                            </template>
                        </VDatePicker>
                        <label class="block my-auto text-sm font-medium text-gray-900 dark:text-white" for="end">
                            {{ administrator.period.end.toLocaleDateString() }}
                        </label>
                    </div>
                </div>
            </div>
            <button type="submit" @click="addAdministrator"
                class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                Add New Administrator
            </button>
        </div>
    </CoreModal>
</template>
<style scoped></style>