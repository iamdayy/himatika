<script setup lang='ts'>
import type { IConfigResponse } from '~/types/IResponse';

const route = useRoute();
const { data: dataConfig } = useFetch<IConfigResponse>('/api/config');
const configs = computed(() => dataConfig.value?.data);
const config = useRuntimeConfig();
// Set up color mode
const colorMode = useColorMode();
const isDarkMode = computed({
    get: () => colorMode.value === 'dark',
    set: () => colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark',
});
useHead({
    titleTemplate(title) {
        return title ? `${title} | ${config.public.appname}` : configs.value?.name || config.public.appname;
    },
});
// This script section is currently empty but can be used for component logic if needed in the future
</script>

<template>
    <nav class="absolute z-10 w-full border-gray-200 md:border-none">
        <div class="flex flex-wrap items-center justify-between p-4 mx-auto">
            <!-- Logo or back button -->
            <NuxtLink to="/" class="items-center space-x-3 rtl:space-x-reverse">
                <NuxtImg provider="localProvider" src="/img/logo.png" class="h-8" alt="Logo" loading="lazy" />
            </NuxtLink>

            <!-- Theme toggle -->
            <UButton :icon="isDarkMode ? 'i-lucide-moon' : 'i-lucide-sun'" :color="isDarkMode ? 'neutral' : 'primary'"
                variant="ghost" class="rounded-full" @click="isDarkMode = !isDarkMode" />
        </div>
    </nav>
    <!-- Main container for the authentication layout -->
    <div class="relative min-h-[calc(100vh-8rem)]">
        <!-- Centered content wrapper -->
        <div class="absolute w-full px-4 py-8 transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
            <!-- Navigation tabs for Login and Register -->
            <ul class="flex flex-row w-full max-w-md gap-3 mx-auto mb-12 font-sans font-semibold text-center text-white dark:text-gray-200 bg-accent-1 dark:bg-accent-2 rounded-xl"
                v-if="route.name === 'login' || route.name === 'register'">
                <!-- Login tab -->
                <li class="w-1/2 m-1">
                    <nuxt-link to="/login"
                        class="inline-block w-full px-4 py-3 rounded-lg hover:bg-accent-2 dark:hover:bg-accent-1 hover:text-white"
                        active-class="bg-accent-3 text-primary-dark dark:text-primary-light hover:bg-accent-2 dark:hover:bg-accent-1 hover:text-secondary-dark dark:hover:text-secondary-light">{{
                            $ts('login') }}</nuxt-link>
                </li>
                <!-- Register tab -->
                <li class="w-1/2 m-1">
                    <nuxt-link to="/register"
                        class="inline-block w-full px-4 py-3 rounded-lg hover:bg-accent-2 dark:hover:bg-accent-1 hover:text-white"
                        active-class="bg-accent-3 text-primary-dark dark:text-primary-light hover:bg-accent-2 dark:hover:bg-accent-1 hover:text-secondary-dark dark:hover:text-secondary-light">{{
                            $ts('register') }}</nuxt-link>
                </li>
            </ul>
            <!-- 3D card wrapper for content -->
            <div class="mx-auto card-3d-wrap">
                <div class="w-full card-3d-wrapper">
                    <!-- Slot for injecting page-specific content -->
                    <slot></slot>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
/* Style for elements with mix-blend-mode: difference */
.block-diff {
    display: block;
    mix-blend-mode: difference;
}

/* 3D card wrap styles */
.card-3d-wrap {
    position: relative;
    width: 100%;
    max-width: 720px;
    height: 100%;
    min-height: 510px;
    -webkit-transform-style: preserve-3d;
    transform-style: preserve-3d;
    perspective: 1000px;
    margin-bottom: 20px;
}

/* 3D card wrapper styles */
.card-3d-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    -webkit-transform-style: preserve-3d;
    transform-style: preserve-3d;
    transition: transform 700ms 400ms ease-out;
}

/* Responsive adjustments */
@media (max-width: 640px) {
    .card-3d-wrap {
        max-width: 100%;
    }
}
</style>