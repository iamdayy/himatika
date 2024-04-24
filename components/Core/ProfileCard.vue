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
            <div class="flex justify-center mt-4 md:mt-6">
                <ModalsProfileView></ModalsProfileView>
                <!-- <a href="#"
                    class="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg ms-2 focus:outline-none hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">Message</a> -->
            </div>
        </div>
    </div>

</template>
<style scoped></style>