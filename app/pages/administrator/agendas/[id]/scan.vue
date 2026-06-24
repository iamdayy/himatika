<script setup lang='ts'>
definePageMeta({
    layout: 'dashboard',
    middleware: ['sidebase-auth', 'organizer']
});

const route = useRoute();
const id = route.params.id as string;
const { $api } = useNuxtApp();
const toast = useToast();

// Ambil data agenda untuk menampilkan judul
const { data: agenda } = useLazyAsyncData(`agenda-${id}`, () => $api<any>(`/api/agenda/${id}`));

// State
const processing = ref(false);
const scannerActive = ref(false); // Menahan kamera sebelum tombol 'Mulai' ditekan
const lastResult = ref<any>(null);
const scanHistory = ref<any[]>([]);
const audioSuccess = ref<HTMLAudioElement | null>(null);
const audioError = ref<HTMLAudioElement | null>(null);

onMounted(() => {
    // Preload sounds
    audioSuccess.value = new Audio('/sound/success.mp3'); 
    audioError.value = new Audio('/sound/error.mp3');
});

// Fungsi untuk bypass Autoplay Policy di Safari/iOS
const initScanner = () => {
    if (audioSuccess.value) {
        audioSuccess.value.volume = 0;
        audioSuccess.value.play().catch(() => {}).finally(() => {
            if (audioSuccess.value) {
                audioSuccess.value.pause();
                audioSuccess.value.volume = 1;
                audioSuccess.value.currentTime = 0;
            }
        });
    }
    if (audioError.value) {
        audioError.value.volume = 0;
        audioError.value.play().catch(() => {}).finally(() => {
            if (audioError.value) {
                audioError.value.pause();
                audioError.value.volume = 1;
                audioError.value.currentTime = 0;
            }
        });
    }
    scannerActive.value = true;
};

// Logic Scan
const handleScan = async (code: string) => {
    if (processing.value) return; // Debounce agar tidak double scan
    if (lastResult.value?.code === code && lastResult.value?.status === 'success') return; // Mencegah scan ulang kode yang sama berturut-turut

    processing.value = true;

    try {
        // Panggil API Check-in
        const res = await $api<any>(`/api/agenda/${id}/scan`, {
            method: 'POST',
            body: { code }
        });

        // Feedback Sukses
        if (audioSuccess.value) audioSuccess.value.play();

        const resultData = {
            code, // Simpan untuk referensi debounce, tapi tidak ditampilkan di UI
            name: res.participant.name,
            role: res.role, // 'Committee' atau 'Participant'
            detail: res.participant.NIM !== "N/A" ? res.participant.NIM : res.participant.institution,
            class: res.participant.class,
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

// Konfigurasi kolom UTable
const tableColumns = [
    { key: 'time', label: 'Waktu' },
    { key: 'name', label: 'Nama' },
    { key: 'status', label: 'Status' }
];
</script>

<template>
    <div class="max-w-xl mx-auto space-y-6 px-4 sm:px-0">
        <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between">
                <h1 class="text-2xl font-bold flex items-center gap-2">
                    <UIcon name="i-heroicons-qr-code" /> Scanner Presensi
                </h1>
                <UButton to="./" color="neutral" variant="ghost" icon="i-heroicons-arrow-left">Kembali</UButton>
            </div>
            <p v-if="agenda?.data?.agenda?.title" class="text-gray-500 dark:text-gray-400 font-medium">
                {{ agenda.data.agenda.title }}
            </p>
        </div>

        <div class="relative min-h-[300px] bg-black rounded-xl overflow-hidden flex items-center justify-center">
            <!-- Tampilkan Scanner hanya jika scannerActive == true -->
            <ScannerWrapper v-if="scannerActive" @result="handleScan" @error="(msg) => toast.add({ title: msg, color: 'error' })" />
            
            <!-- Layar Tunggu sebelum diklik -->
            <div v-else class="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-20 text-white p-6 text-center">
                <UIcon name="i-heroicons-video-camera" class="w-16 h-16 text-gray-400 mb-4" />
                <h3 class="text-xl font-bold mb-2">Kamera Siaga</h3>
                <p class="text-gray-400 mb-6 text-sm max-w-sm">Tekan tombol di bawah untuk mengaktifkan scanner dan memancing izin audio browser.</p>
                <UButton size="lg" color="primary" icon="i-heroicons-play" @click="initScanner">Mulai Scanner</UButton>
            </div>

            <div v-if="processing"
                class="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30">
                <UIcon name="i-heroicons-arrow-path" class="animate-spin text-white text-5xl" />
            </div>
        </div>

        <!-- Ruang fixed height agar tidak ada layout shift -->
        <div class="min-h-[180px]">
            <Transition
                enter-active-class="transition duration-300 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-200 ease-in"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
            >
                <div v-show="lastResult" :class="[
                    'p-6 rounded-xl text-center border-2 shadow-sm',
                    lastResult?.status === 'success' 
                        ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-400' 
                        : 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-400'
                ]">
                    <UIcon :name="lastResult?.status === 'success' ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                        class="text-5xl mb-2" />
                    <h2 class="text-2xl font-bold">{{ lastResult?.name }}</h2>
                    <p v-if="lastResult?.detail" class="font-mono text-sm opacity-90 mt-1">
                        {{ lastResult.detail }} <span v-if="lastResult.class && lastResult.class !== 'N/A'">- Kelas {{ lastResult.class }}</span>
                    </p>
                    <p class="mt-2 font-semibold uppercase tracking-wider text-sm">{{ lastResult?.message || 'Check-in Berhasil' }}</p>
                    <p v-if="lastResult?.role" class="mt-2 text-xs bg-white/50 dark:bg-black/20 inline-block px-3 py-1 rounded-full font-medium shadow-sm">
                        {{ lastResult.role === 'Committee' ? 'Panitia' : 'Peserta' }}
                    </p>
                </div>
            </Transition>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 class="font-semibold">Riwayat Scan Sesi Ini</h3>
                <UButton size="xs" color="neutral" variant="ghost" @click="clearHistory">Clear</UButton>
            </div>
            
            <UTable :rows="scanHistory" :columns="tableColumns" :ui="{ td: { padding: 'py-3' } }">
                <template #time-data="{ row }">
                    <span class="font-mono text-xs opacity-75">{{ row.timestamp.toLocaleTimeString() }}</span>
                </template>
                <template #name-data="{ row }">
                    <div class="flex flex-col">
                        <span class="font-medium text-sm">{{ row.name }}</span>
                        <span class="text-xs opacity-70" v-if="row.detail">{{ row.detail }}</span>
                    </div>
                </template>
                <template #status-data="{ row }">
                    <UBadge :color="row.status === 'success' ? 'success' : 'error'" variant="subtle" size="xs">
                        {{ row.status === 'success' ? 'OK' : 'FAIL' }}
                    </UBadge>
                </template>
                <template #empty-state>
                    <div class="flex flex-col items-center justify-center py-6 gap-3">
                        <span class="italic text-sm text-gray-500">Belum ada data scan</span>
                    </div>
                </template>
            </UTable>
        </div>

        <p class="text-xs text-center text-gray-400 pb-8">
            *Pastikan volume HP aktif untuk mendengar suara beep.
        </p>
    </div>
</template>