<script setup lang='ts'>
import { Modal } from 'flowbite';
import type { ModalOptions, ModalInterface } from 'flowbite';
import type { InstanceOptions } from 'flowbite';
import type { IDepartement, IProfile } from '~/types';

const { data: profiles } = await useAsyncData<IProfile[]>(() => $fetch("/api/profile"))
const { $toast } = useNuxtApp();

const emit  = defineEmits(["triggerRefresh"]);

const departement = ref<IDepartement>({
    profile: 0,
    departement: "",
    period: {
        start: new Date(),
        end: new Date()
    }
});

const getNameFromNIM =  (NIM?: number) => {
    return profiles.value?.find((profile) => profile.NIM == NIM)?.fullName;
}

const addDepartement = async () => {
    try {
        const added = await $fetch("/api/departement", {
            method: "POST",
            body: departement.value
        });
        
        const modalElement: HTMLElement = document.querySelector('#add-departement-modal') as HTMLElement;
        const instanceOptions: InstanceOptions = {
            id: 'add-departement-modal',
            override: true
        };
        const modal: ModalInterface = new Modal(modalElement, {}, instanceOptions);
        $toast(added.statusMessage!);
        modal.hide();
        emit("triggerRefresh");
    } catch (error) {
        $toast("Failed to add new Departements");
    }
};
</script>
<template>
    <CoreModal name="add-departement">
        <div class="p-6 space-y-6">
            <div class="grid grid-cols-6 gap-6">
                <div class="col-span-6 sm:col-span-3">
                    <label for="Profile"
                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">NIM</label>
                        <input type="number" name="Profile" id="Profile"
                        class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="102240033" v-model="departement.profile" required>
                        <label for="Profile"
                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{{ getNameFromNIM(departement.profile as number) }}</label>
                </div>
                <div class="col-span-6 sm:col-span-3">
                    <label for="departement"
                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Departement</label>
                        <input type="text" name="departement" id="departement"
                        class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="..." v-model="departement.departement" required>
                </div>
                <div class="col-span-3">
                    <label for="start"
                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Start</label>
                        <div class="flex gap-3 p-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-500">
                            <VDatePicker id="start" v-model="departement.period.start" mode="date">
                                <template #default="{ togglePopover }">
                                    <button @click="togglePopover">
                                        <Icon name="solar:calendar-date-outline"
                                            class="w-6 h-6 mx-2 text-gray-400 hover:text-blue-600" />
                                    </button>
                                </template>
                            </VDatePicker>
                            <label class="block my-auto text-sm font-medium text-gray-900 dark:text-white" for="start">
                                {{ departement.period.start.toLocaleDateString() }}
                            </label>
                        </div>
                </div>
                <div class="col-span-3">
                    <label for="end" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">End</label>
                    <div class="flex gap-2 p-2 border border-gray-300 rounded-lg shadow-sm dark:border-gray-500">
                        <VDatePicker id="end" v-model="departement.period.end" mode="date">
                            <template #default="{ togglePopover }">
                                <button @click="togglePopover">
                                    <Icon name="solar:calendar-date-outline"
                                        class="w-6 h-6 mx-2 text-gray-400 hover:text-blue-600" />
                                </button>
                            </template>
                        </VDatePicker>
                        <label class="block my-auto text-sm font-medium text-gray-900 dark:text-white" for="end">
                            {{ departement.period.end.toLocaleDateString() }}
                        </label>
                    </div>
                </div>
            </div>
            <button type="submit" @click="addDepartement"
                class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                Add New Departement
            </button>
        </div>
    </CoreModal>
</template>
<style scoped></style>