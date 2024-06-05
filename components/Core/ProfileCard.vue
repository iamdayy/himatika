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
});
</script>
<template>
    <CoreFlipCard :img="profile?.avatar || '/img/profile-blank.png'">
        <template #front>
            <h2 class="text-2xl font-semibold text-gray-200">{{ subtitle }}</h2>
            <div class="absolute bottom-16">
                <h1 class="mb-2 text-4xl font-semibold text-white -translate-x-14">{{ profile?.fullName }}</h1>
                <h1 class="mb-2 text-xl font-medium text-white">{{ profile?.NIM }}</h1>
            </div>
            <div></div>
        </template>
        <template #back>
            <div>
                <h1 class="mb-2 text-3xl font-semibold text-white -translate-x-14">{{ profile?.fullName }}</h1>
                <dl class="max-w-md text-gray-200 dark:text-white">
                    <div class="flex flex-col pb-2">
                        <dt class="text-gray-400 dark:text-gray-300">Email address</dt>
                        <hr class="mb-1 w-[105px] h-[1px] bg-gray-100 border-0 rounded dark:bg-gray-200">
                        <dd class="text-lg font-semibold">{{ profile?.email }}</dd>
                    </div>
                    <div class="flex flex-col py-2">
                        <dt class="text-gray-400 dark:text-gray-300">Class</dt>
                        <hr class="mb-1 w-[45px] h-[1px] bg-gray-100 border-0 rounded dark:bg-gray-200">
                        <dd class="text-lg font-semibold">{{ profile?.class }}</dd>
                    </div>
                    <div class="flex flex-col py-2">
                        <dt class="text-gray-400 dark:text-gray-300">Semester</dt>
                        <hr class="mb-1 w-[75px] h-[1px] bg-gray-100 border-0 rounded dark:bg-gray-200">
                        <dd class="text-lg font-semibold">{{ profile?.semester }}</dd>
                    </div>
                    <div class="flex flex-col pt-2">
                        <dt class="text-gray-400 dark:text-gray-300">Entered year</dt>
                        <hr class="mb-1 w-[98px] h-[1px] bg-gray-100 border-0 rounded dark:bg-gray-200">
                        <dd class="text-lg font-semibold">{{ profile?.enteredYear }}</dd>
                    </div>
                </dl>
            </div>
        </template>
    </CoreFlipCard>
</template>
<style scoped></style>