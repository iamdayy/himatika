<script setup lang='ts'>
import type { IAdministrator, IProfile } from '~/types';

const { $toast } = useNuxtApp();
definePageMeta({
    middleware: "auth"
});
useHead({
    title: "Administrator | Himatika"
});

const { access: canAccessAdd, role } = useRole(["Chairman"]);

const option = ref<string>(`${new Date(Date.now()).getFullYear()} - ${new Date(Date.now()).getFullYear() + 1}`);

const getStartYear = (opt: string): number => {
    const year = parseInt(opt.slice(0,5).match(/\d/g)?.join("")!);
    return year;
}
const getEndYear = (opt: string): number => {
    const year = parseInt(opt.slice(5).match(/\d/g)?.join("")!);
    return year;
}
const { data: administrators, refresh } = await useAsyncData(() => $fetch<IAdministrator[]>("/api/administrator"));
const administrator = computed<IAdministrator | undefined>(() => {
    return administrators.value?.find((admin) => getStartYear(option.value) <= new Date(admin.period.start).getFullYear() && getEndYear(option.value) >= new Date(admin.period.end).getFullYear() );
});

const options = administrators.value?.map((administrator) => `${new Date(administrator.period.start).getFullYear()} - ${new Date(administrator.period.end).getFullYear()}`);
</script>
<template>
    <div class="max-w-6xl py-3 mx-auto overflow-x-auto rounded-md shadow-md sm:rounded-lg">
        <div
            class="flex flex-wrap items-center justify-between py-4 space-y-4 bg-white flex-column md:flex-row md:space-y-0 dark:bg-gray-900 px-2.5 border-b border-gray-300 dark:border-gray-500 shadow-md">
            <ModalsAdministratorsAdd @trigger-refresh="refresh" v-if="canAccessAdd" />
            <FormSelect placeholder="Select Period" :options="options" v-model="option" />
        </div>
        <div class="grid grid-cols-2 gap-3 py-8 justify-items-center" v-if="administrator">
            <CoreProfileCard v-for="member, i in administrator.AdministratorMembers" :key="i" :profile="member.profile as IProfile" :subtitle="member.role" />
        </div>
    </div>
</template>
<style scoped></style>