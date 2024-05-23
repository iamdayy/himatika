<script setup lang='ts'>
import { initTabs } from 'flowbite';
import type { IDepartement, IProfile } from '~/types';

const { $toast } = useNuxtApp();
definePageMeta({
    middleware: "auth"
});
useHead({
    title: "Departement | Himatika"
});

interface IDepByDepartement {
    [key: string]: IDepartement[];
}

const { isAdmin } = useRole();
const { isDept } = useDept();

const option = ref<string>(`${new Date(Date.now()).getFullYear()} - ${new Date(Date.now()).getFullYear()}`);

const getStartYear = (opt: string): number => {
    const year = parseInt(opt.slice(0, 5).match(/\d/g)?.join("")!);
    return year;
}
const getEndYear = (opt: string): number => {
    const year = parseInt(opt.slice(5).match(/\d/g)?.join("")!);
    return year;
}
const { data, refresh } = await useAsyncData(() => $fetch<IDepartement[]>("/api/departement"));
const departements = computed<IDepartement[] | undefined>( () =>
    {
        return data.value?.filter((dep) => new Date(dep.period.start).getFullYear() >= getStartYear(option.value) && new Date(dep.period.end).getFullYear() <= getEndYear(option.value));
    });

const options = data.value?.map((d) => `${new Date(d.period.start).getFullYear()} - ${new Date(d.period.end).getFullYear()}`);

const groupByKey = (_data: any[], _key: string): IDepByDepartement => {
    return _data.reduce((result, next) => {
        const key = next[_key];
        result[key] = result[key]?.length ? [...result[key], next] : [next];
        console.log(result);
        
        return result;
    }, {} as IDepByDepartement);
}
const getObjIsFirst = (val: string) => {
    const obj = groupByKey(departements.value!, 'departement');
    return val == Object.keys(obj)[0];
}
onMounted(() => {
    initTabs();
})
</script>
<template>
    <div class="max-w-6xl py-3 mx-auto overflow-x-auto rounded-md shadow-md sm:rounded-lg" v-if="departements">
        <div
            class="flex flex-wrap items-center justify-between py-4 space-y-4 bg-white flex-column md:flex-row md:space-y-0 dark:bg-gray-900 px-2.5 border-b border-gray-300 dark:border-gray-500 shadow-md">
            <ModalsDepartementsAdd @trigger-refresh="refresh" v-if="isDept || isAdmin" />
            <ul class="flex flex-wrap text-sm font-medium text-center text-gray-500 dark:text-gray-400" id="about-tab"
                data-tabs-toggle="#tab-content" role="tablist">
                <li class="me-2" role="presentation"
                    v-for="([key, val], i) in Object.entries(groupByKey(departements!, 'departement'))" :key="i">
                    <button class="inline-block px-4 py-3 rounded-lg" :id="`${key}-tab`" :data-tabs-target="`#${key}`"
                        type="button" role="tab" :aria-controls="`${key}`" :aria-selected="getObjIsFirst(key)">{{ key
                        }}</button>
                </li>
            </ul>
            <FormSelect placeholder="Select Period" :options="options" v-model="option" />
        </div>
        <div id="tab-content" class="w-full">
            <div class="hidden" v-for="([key, val], i) in Object.entries(groupByKey(departements!, 'departement'))"
                :key="i" :id="`${key}`" role="tabpanel" :aria-labelledby="`${key}-tab`">
                <div class="grid grid-cols-2 gap-3 py-8 justify-items-center">
                    <CoreProfileCard v-for="departement, i in val" :profile="departement.profile as IProfile"
                        :subtitle="departement.departement" />
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped></style>