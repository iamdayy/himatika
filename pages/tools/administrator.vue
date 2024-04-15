<script setup lang='ts'>
import type { IAdministrator, IProfile } from '~/types';

const { $toast } = useNuxtApp();
definePageMeta({
    middleware: "auth"
});
useHead({
    title: "Data Mahasiswa | Himatika"
});

const option = ref<string>(`${new Date(Date.now()).getFullYear()} - ${new Date(Date.now()).getFullYear()}`);

const getStartYear = (opt: string): number => {
    const year = parseInt(opt.slice(0,5).match(/\d/g)?.join("")!);
    return year;
}
const getEndYear = (opt: string): number => {
    const year = parseInt(opt.slice(5).match(/\d/g)?.join("")!);
    return year;
}
const { data: administrators, refresh } = await useAsyncData(() => $fetch<IAdministrator[]>("/api/administrator"));
const administrator = ref<IAdministrator | undefined>(administrators.value?.find((admin) => new Date(admin.period.start).getFullYear() >= getStartYear(option.value) && new Date(admin.period.end).getFullYear() <= getEndYear(option.value)));

const options = administrators.value?.map((administrator) => `${new Date(administrator.period.start).getFullYear()} - ${new Date(administrator.period.end).getFullYear()}`);
</script>
<template>
    <div class="max-w-6xl py-3 mx-auto overflow-x-auto rounded-md shadow-md sm:rounded-lg">
        <div
            class="flex flex-wrap items-center justify-between py-4 space-y-4 bg-white flex-column md:flex-row md:space-y-0 dark:bg-gray-900 px-2.5 border-b border-gray-300 dark:border-gray-500 shadow-md">
            <ModalsAdministratorsAdd @trigger-refresh="refresh" />
            <FormSelect placeholder="Select Period" :options="options" v-model="option" />
        </div>
        <div class="grid grid-cols-2 gap-3 py-8 justify-items-center" v-if="administrator">
            <CoreProfileCard :profile="administrator?.chairman as IProfile" subtitle="Chairman" />
            <CoreProfileCard :profile="administrator?.viceChairman as IProfile" subtitle="Vice Chairman" />
            <CoreProfileCard :profile="administrator?.secretary as IProfile" subtitle="Secretary" />
            <CoreProfileCard :profile="administrator?.viceSecretary as IProfile" subtitle="Vice Secretary" />
            <CoreProfileCard :profile="administrator?.treasurer as IProfile" subtitle="Treasurer" />
            <CoreProfileCard :profile="administrator?.viceTreasurer as IProfile" subtitle="Vice Treasurer" />
        </div>
    </div>
</template>
<style scoped></style>