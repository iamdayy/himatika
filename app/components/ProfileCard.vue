<script setup lang='ts'>
import { useWindowSize } from '@vueuse/core';
import type { PropType } from 'vue';
import { computed } from 'vue';
import type { IMember } from '~/types';

/**
 * MemberCard component
 * 
 * This component displays a flip card with a user's member information.
 * The front side shows the user's avatar, name, and NIM (student ID).
 * The back side displays more detailed information such as email, class, semester, and entered year.
 * The component is responsive and adjusts its layout based on screen size.
 */

const props = defineProps({
    /**
     * The member object containing user information
     */
    member: {
        type: Object as PropType<IMember>,
    },
    /**
     * A subtitle to be displayed on the front of the card
     */
    subtitle: {
        type: String
    }
});

// Use VueUse's useWindowSize composable for responsive design
const { width } = useWindowSize();

// Compute if the screen is mobile
const isMobile = computed(() => width.value < 768);

// Compute responsive class names
const responsiveClasses = computed(() => ({
    title: isMobile.value ? 'text-lg -translate-x-4' : 'text-2xl -translate-x-14',
    subtitle: isMobile.value ? 'text-md' : 'text-xl',
    name: isMobile.value ? 'text-lg -translate-x-8' : 'text-2xl -translate-x-14',
    info: isMobile.value ? 'text-xs' : 'text-lg font-semibold',
}));
</script>

<template>
    <FlipCard :img="member?.avatar || '/img/profile-blank.png'">
        <!-- Front side of the card -->
        <template #front>
            <h2 :class="['font-semibold text-gray-800 dark:text-gray-200', responsiveClasses.subtitle]">{{ subtitle }}
            </h2>
            <div class="absolute bottom-16">
                <h1 :class="['mb-2 font-semibold text-gray-800 dark:text-gray-200', responsiveClasses.title]">
                    {{ member?.fullName }}
                </h1>
                <h1 :class="['mb-2 font-medium text-gray-800 dark:text-gray-200', responsiveClasses.subtitle]">{{
                    member?.NIM }}</h1>
            </div>
            <div></div>
        </template>
        <!-- Back side of the card -->
        <template #back>
            <div>
                <h1 :class="['mb-2 font-semibold text-gray-800 dark:text-gray-200', responsiveClasses.name]">
                    {{ member?.fullName }}
                </h1>
                <dl class="max-w-md">
                    <!-- Email address -->
                    <div class="flex flex-col pb-1 md:pb-2">
                        <dt class="text-sm text-gray-800 dark:text-gray-200">Email address</dt>
                        <hr class="mb-1 w-[105px] h-[1px] bg-gray-700 border-0 rounded dark:bg-gray-200">
                        <dd :class="['text-gray-800 dark:text-gray-200', responsiveClasses.info]">{{
                            member?.email }}</dd>
                    </div>
                    <!-- Class -->
                    <div class="flex flex-col py-1 md:py-2">
                        <dt class="text-sm text-gray-800 dark:text-gray-200">Class</dt>
                        <hr class="mb-1 w-[45px] h-[1px] bg-gray-700 border-0 rounded dark:bg-gray-200">
                        <dd :class="['text-gray-800 dark:text-gray-200', responsiveClasses.info]">{{
                            member?.class }}</dd>
                    </div>
                    <!-- Semester -->
                    <div class="flex flex-col py-1 md:py-2">
                        <dt class="text-sm text-gray-800 dark:text-gray-200">Semester</dt>
                        <hr class="mb-1 w-[75px] h-[1px] bg-gray-700 border-0 rounded dark:bg-gray-200">
                        <dd :class="['text-gray-800 dark:text-gray-200', responsiveClasses.info]">{{
                            member?.semester }}</dd>
                    </div>
                    <!-- Entered year -->
                    <div class="flex flex-col pt-1 md:pt-2">
                        <dt class="text-sm text-gray-800 dark:text-gray-200">Entered year</dt>
                        <hr class="mb-1 w-[98px] h-[1px] bg-gray-700 border-0 rounded dark:bg-gray-200">
                        <dd :class="['text-gray-800 dark:text-gray-200', responsiveClasses.info]">{{
                            member?.enteredYear }}</dd>
                    </div>
                </dl>
            </div>
        </template>
    </FlipCard>
</template>

<style scoped>
/* Add any component-specific styles here */
</style>