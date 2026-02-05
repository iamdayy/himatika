<script setup lang='ts'>
definePageMeta({
    layout: 'dashboard',
    middleware: ['sidebase-auth', 'organizer']
});

const route = useRoute();
const id = route.params.id as string;
const { $api } = useNuxtApp();
const toast = useToast();

// State
const processing = ref(false);
const lastResult = ref<any>(null);
const scanHistory = ref<any[]>([]);
const audioSuccess = ref<HTMLAudioElement | null>(null);
const audioError = ref<HTMLAudioElement | null>(null);

type ScanResult = {
    a: string;
    c: string;
}

onMounted(() => {
    // Preload sounds
    audioSuccess.value = new Audio('/sound/success.mp3'); // Pastikan file ini ada atau ganti URL
    audioError.value = new Audio('/sound/error.mp3');
});

// Logic Scan
const handleScan = async (code: string) => {
    if (processing.value) return; // Debounce agar tidak double scan
    if (lastResult.value?.code === code && lastResult.value?.status === 'success') return; // Mencegah scan ulang kode yang sama berturut-turut

    processing.value = true;

    try {
        console.log(code)
        // Panggil API Check-in
        const res = await $api<any>(`/api/agenda/${id}/scan`, {
            method: 'POST',
            body: { code }
        });

        // Feedback Sukses
        if (audioSuccess.value) audioSuccess.value.play();

        const resultData = {
            code,
            name: res.participant.name,
            role: res.role, // 'Committee' atau 'Participant'
            status: 'success',
            timestamp: new Date()
        };

        lastResult.value = resultData;
        scanHistory.value.unshift(resultData);

        toast.add({ title: `Berhasil: ${res.participant.name}`, color: 'success', icon: 'i-heroicons-check-circle' });

    } catch (error: any) {
        // Feedback Gagal
        if (audioError.value) audioError.value.play();

        const errorData = {
            code,
            name: 'Unknown / Invalid',
            status: 'error',
            message: error.data?.message || 'Gagal Scan',
            timestamp: new Date()
        };

        lastResult.value = errorData;

        toast.add({ title: errorData.message, color: 'error', icon: 'i-heroicons-x-circle' });
    } finally {
        // Delay sedikit sebelum bisa scan lagi agar admin sempat lihat hasil
        setTimeout(() => {
            processing.value = false;
        }, 1500);
    }
};

const clearHistory = () => {
    scanHistory.value = [];
    lastResult.value = null;
};
</script>

<template>
    <div class="max-w-xl mx-auto space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold flex items-center gap-2">
                <UIcon name="i-heroicons-qr-code" /> Scanner Presensi
            </h1>
            <UButton to="./" color="neutral" variant="ghost" icon="i-heroicons-arrow-left">Kembali</UButton>
        </div>

        <div class="relative">
            <ScannerWrapper @result="handleScan" @error="(msg) => toast.add({ title: msg, color: 'error' })" />

            <div v-if="processing"
                class="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                <UIcon name="i-heroicons-arrow-path" class="animate-spin text-white text-5xl" />
            </div>
        </div>

        <div v-if="lastResult" :class="[
            'p-6 rounded-xl text-center border-2 transition-all duration-300 transform scale-100',
            lastResult.status === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'
        ]">
            <UIcon :name="lastResult.status === 'success' ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                class="text-6xl mb-2" />
            <h2 class="text-2xl font-bold">{{ lastResult.name }}</h2>
            <p class="font-mono text-sm opacity-75 mt-1">{{ lastResult.code }}</p>
            <p class="mt-2 font-semibold uppercase">{{ lastResult.message || 'Check-in Berhasil' }}</p>
            <p v-if="lastResult.role" class="mt-1 text-sm bg-white/50 inline-block px-2 py-1 rounded">
                {{ lastResult.role === 'Committee' ? 'Panitia' : 'Peserta' }}
            </p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 class="font-semibold">Riwayat Scan Sesi Ini</h3>
                <UButton size="xs" color="neutral" variant="ghost" @click="clearHistory">Clear</UButton>
            </div>
            <div class="max-h-64 overflow-y-auto p-0">
                <table class="w-full text-sm text-left">
                    <thead class="bg-gray-50 dark:bg-gray-700 text-gray-500">
                        <tr>
                            <th class="p-3">Waktu</th>
                            <th class="p-3">Nama</th>
                            <th class="p-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(log, idx) in scanHistory" :key="idx" class="border-b dark:border-gray-700">
                            <td class="p-3 font-mono text-xs">{{ log.timestamp.toLocaleTimeString() }}</td>
                            <td class="p-3 font-medium">{{ log.name }}</td>
                            <td class="p-3">
                                <UBadge :color="log.status === 'success' ? 'success' : 'error'" variant="subtle"
                                    size="xs">
                                    {{ log.status === 'success' ? 'OK' : 'FAIL' }}
                                </UBadge>
                            </td>
                        </tr>
                        <tr v-if="scanHistory.length === 0">
                            <td colspan="3" class="p-4 text-center text-gray-400 text-xs">Belum ada data scan</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <p class="text-xs text-center text-gray-400">
            *Pastikan volume HP aktif untuk mendengar suara beep.
        </p>
    </div>
</template>