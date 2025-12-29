<script setup lang='ts'>
definePageMeta({
    layout: 'client', // Layout user biasa
    middleware: 'sidebase-auth' // Wajib login
});

const { $api } = useNuxtApp();
const toast = useToast();
const router = useRouter();

const processing = ref(false);
const scanResult = ref<any>(null);
const errorMsg = ref('');

// Audio Feedback
const playSuccess = () => new Audio('/sound/success.mp3').play().catch(() => { });
const playError = () => new Audio('/sound/error.mp3').play().catch(() => { });

const handleScan = async (agendaId: string) => {
    if (processing.value) return;
    // Jika baru saja sukses scan agenda yang SAMA, jangan scan lagi
    if (scanResult.value?.status === 'success' && scanResult.value?.agendaId === agendaId) return;

    processing.value = true;
    errorMsg.value = '';

    try {
        const res = await $api<any>(`/api/agenda/${agendaId}/attend`, {
            method: 'POST',
        });

        playSuccess();

        scanResult.value = {
            status: 'success',
            agendaId, // simpan ID biar gak loop scan
            message: res.message,
            role: res.role
        };

        toast.add({ title: 'Berhasil!', description: res.message, color: 'success' });

        // Opsional: Redirect ke detail agenda setelah 2 detik
        setTimeout(() => {
            router.push(`/agendas/${agendaId}`);
        }, 2000);

    } catch (err: any) {
        playError();
        const msg = err.data?.message || 'Gagal memproses QR Code';
        errorMsg.value = msg;
        toast.add({ title: 'Gagal', description: msg, color: 'error' });
    } finally {
        // Jeda sebentar agar user sempat lihat pesan error/sukses sebelum kamera aktif mendeteksi lagi
        setTimeout(() => {
            processing.value = false;
            // Jika error, kita clear result biar bisa coba lagi
            if (errorMsg.value) {
                scanResult.value = null;
            }
        }, 2000);
    }
};
</script>

<template>
    <div class="min-h-screen bg-gray-50/30 dark:bg-gray-900/40 pt-6 px-4 pb-20 rounded-2xl">
        <div class="max-w-md mx-auto space-y-6">

            <div class="text-center">
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">Presensi Mandiri</h1>
                <p class="text-gray-500 text-sm">Arahkan kamera ke QR Code yang ditampilkan panitia.</p>
            </div>

            <div class="relative rounded-2xl overflow-hidden shadow-xl border-4 border-white dark:border-gray-800">
                <ScannerWrapper @result="handleScan" @error="(m) => errorMsg = m" />

                <div v-if="processing"
                    class="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-20">
                    <UIcon name="i-heroicons-arrow-path" class="animate-spin text-5xl mb-2" />
                    <span class="font-medium">Memproses Presensi...</span>
                </div>

                <div v-if="scanResult?.status === 'success'"
                    class="absolute inset-0 bg-green-500/90 flex flex-col items-center justify-center text-white z-20 animate-in fade-in duration-300">
                    <UIcon name="i-heroicons-check-circle-solid" class="text-7xl mb-2" />
                    <h3 class="text-2xl font-bold">Hadir!</h3>
                    <p>{{ scanResult.message }}</p>
                </div>
            </div>

            <UAlert v-if="errorMsg" icon="i-heroicons-exclamation-triangle" color="error" variant="subtle"
                title="Gagal Scan" :description="errorMsg" />

            <div class="text-center mt-8">
                <UButton to="/dashboard" variant="ghost" color="neutral">Kembali ke Dashboard</UButton>
            </div>
        </div>
    </div>
</template>