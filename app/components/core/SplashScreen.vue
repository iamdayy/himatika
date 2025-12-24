<script setup lang="ts">
const props = defineProps<{
    loading: boolean
}>()
</script>

<template>
    <Transition name="fade">
        <div v-if="loading"
            class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-gray-900">
            <div class="relative flex flex-col items-center">
                <NuxtImg src="/img/logo.png" alt="Logo Himatika" class="w-24 h-24 mb-4 animate-pulse" width="96"
                    height="96" />
                <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-primary-500" />

                <p class="mt-4 text-md font-medium text-gray-500 animate-pulse">
                    Selamat Datang di Website resmi
                </p>
                <h1 class="text-2xl font-bold text-gray-900 animate-pulse dark:text-gray-200">
                    HIMPUNAN MAHASISWA INFORMATIKA </br>
                    FAKULTAS SAINS DAN TEKNOLOGI </br>
                    ITSNU PEKALONGAN
                </h1>
                <p class="mt-4 text-sm font-medium text-gray-500 animate-pulse">
                    Memuat Aplikasi...
                </p>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
/* Animasi Fade Out yang Halus */
.fade-leave-active {
    transition: opacity 0.5s ease;
}

.fade-leave-to {
    opacity: 0;
}
</style>