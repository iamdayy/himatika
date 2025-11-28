<script setup lang='ts'>
const { data } = useFetch('/api/config');
const config = computed(() => data.value?.data);
// No setup logic needed for this component
</script>

<template>
    <!-- Footer component -->
    <footer class="w-full pt-8 mb-4">
        <div class="container px-4 mx-auto">
            <!-- Organization information section -->
            <div class="flex flex-col items-center md:flex-row">
                <!-- Organization logo -->
                <NuxtImg class="object-contain w-24 mb-4 md:w-32 md:mb-0" provider="localProvider" src="/img/logo.png"
                    alt="Logo" loading="lazy" />
                <div class="w-full text-center md:pl-4 md:text-left">
                    <!-- Organization name -->
                    <h4 class="text-xl font-bold text-gray-600 md:text-3xl text-uppercase dark:text-gray-300">{{
                        config?.name }}</h4>
                    <!-- Contact information -->
                    <h5 class="mt-2 mb-2 text-sm text-gray-500 md:text-lg dark:text-gray-400">
                        <span>
                            {{ config?.address }} <br />
                        </span>
                        <span>
                            Email : {{ config?.contact.email }} <br />
                        </span>
                        <span>
                            Tlp/Wa : {{ config?.contact.phone }}
                        </span>
                    </h5>
                    <!-- Social media buttons -->
                    <div class="flex flex-row items-center justify-center gap-2 mx-auto mt-4 mb-6 md:justify-start">
                        <UButton v-for="socialMedia, i in config?.socialMedia" :key="i"
                            :icon="`i-ph-${socialMedia.name.toLowerCase()}-logo`" variant="outline" class="rounded-full"
                            :to="socialMedia.url" external color="neutral" />
                    </div>
                </div>
            </div>
        </div>
        <!-- Horizontal line separator -->
        <hr class="mx-auto my-2">
        <!-- Copyright section -->
        <div class="container px-4 mx-auto">
            <div class="text-center">
                <div class="py-1 text-sm font-semibold text-gray-700 dark:text-gray-400">
                    Copyright © <span id="get-current-year">2024</span>
                    <a href="https://iamdayy.web.app"
                        class="text-gray-600 hover:text-gray-500 dark:text-gray-400 hover:dark:text-gray-200">
                        Iamdayy</a>.
                </div>
            </div>
        </div>
    </footer>
</template>

<style scoped>
/* Responsive adjustments can be added here if needed */
@media (max-width: 768px) {
    /* Mobile-specific styles */
}
</style>