<script setup lang='ts'>
import type { PropType } from 'vue';
import type { IProfile } from '~/types';


const props = defineProps({
    profile: {
        type: Object as PropType<IProfile>,
    },
    subtitle: {
        type: String
    }
})

</script>
<template>
    <div
        class="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
        <div class="flex flex-col items-center py-8">
            <NuxtImg class="rounded-full shadow-lg" :src="profile?.avatar || '/img/profile-blank.png'" sizes="240"
                :alt="profile?.fullName" />
            <h5 class="mb-1 text-xl font-medium text-gray-900 dark:text-white">{{ profile?.fullName }}</h5>
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ subtitle }}</span>
            <div class="flex mt-4 md:mt-6">
                <a href="#"
                    class="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">View Profile</a>
                <a href="#"
                    class="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg ms-2 focus:outline-none hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">Message</a>
            </div>
        </div>
    </div>

</template>
<style scoped></style>