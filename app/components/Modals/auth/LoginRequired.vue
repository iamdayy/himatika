<script setup lang="ts">
defineProps<{
    email: string;
    callbackUrl: string;
}>();

defineEmits(['close']);
</script>

<template>
    <UModal @close="$emit('close')">
        <template #body>
            <div class="flex flex-col items-center">
                <div class="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mb-4">
                    <UIcon name="i-heroicons-user-circle" class="w-10 h-10" />
                </div>
                <div class="text-center">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Email Terdaftar Sebagai Mahasiswa</h3>
                    <p class="text-gray-500 dark:text-gray-400">
                        Sistem mendeteksi bahwa email <span class="font-semibold text-gray-700 dark:text-gray-300">{{ email }}</span> sudah terdaftar sebagai akun Mahasiswa (Member). Silakan login terlebih dahulu untuk melanjutkan pendaftaran acara ini menggunakan akun Anda.
                    </p>
                </div>
            </div>
        </template>
        <template #footer>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <UButton color="neutral" variant="soft" @click="$emit('close')" class="justify-center flex-1">
                    Kembali
                </UButton>
                <UButton color="primary" :to="`/login?callbackUrl=${callbackUrl}`" class="justify-center flex-1" @click="$emit('close')">
                    Login Sekarang
                </UButton>
            </div>
        </template>
    </UModal>
</template>
