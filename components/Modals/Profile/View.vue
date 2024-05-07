<script setup lang='ts'>
import type { PropType } from 'vue';
import type { IProfile } from '~/types';

const props = defineProps({
    profile: Object as PropType<IProfile>
})
</script>
<template>
    <CoreModal name="view-profile" head-title="Onad"
        class="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
        <div class="p-3">
            <div class="flex items-center justify-between mb-2">
                <NuxtImg class="rounded-full shadow-lg" :src="profile?.avatar || '/img/profile-blank.png'" sizes="240"
                    :alt="profile?.fullName" />
                <div>
                    <button type="button"
                        class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-xs px-3 py-1.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Follow</button>
                </div>
            </div>
            <p class="text-base font-semibold leading-none text-gray-900 dark:text-white">
                <a href="#">{{ profile?.fullName }}</a>
            </p>
            <p class="mb-3 text-sm font-normal">
                {{ profile?.email }}
            </p>
            <p class="mb-4 text-sm">Open-source contributor. Building.</p>
            <div>
                
            </div>
        </div>
    </CoreModal>
</template>
<style scoped></style>