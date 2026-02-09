<script setup lang="ts">
import type { ICategory, IMember } from '~~/types';
import { type IAgendaResponse, type ICommitteeResponse } from '~~/types/IResponse';

const route = useRoute();
const { $api } = useNuxtApp();
const agendaId = route.params.id as string;
const { makeTicket } = useMakeDocs();

// 1. Fetch Agenda Data & Committee Status
const { data: agenda, pending, error } = useAsyncData('agenda', () => $api<IAgendaResponse>(`/api/agenda/${agendaId}`), {
    transform: (data) => {
        if (!data.data) return null;
        return data.data.agenda;
    },
    default: () => null,
});

const { data: me, pending: mePending } = useAsyncData('committee-registration', () => $api<ICommitteeResponse>(`/api/agenda/${agendaId}/committee/me`), {
    transform: (data) => {
        if (!data.data) return null;
        return data.data.committee;
    },
    default: () => null,
});

// Cek Status Pembayaran
const isPaymentRequired = computed(() => {
    if (!agenda.value || !me.value) return false;
    const agendaConfig = agenda.value.configuration?.committee;
    return agendaConfig?.pay;
});

const isPaid = computed(() => {
    if (!isPaymentRequired.value) return true;
    const status = me.value?.payment?.status;
    return status === 'success';
});

// Cek Status Jawaban (Jika ada)
const isQuestionsAnswered = computed(() => {
    const questions = agenda.value?.configuration?.committee.questions || [];
    if (questions.length === 0) return true;
    const userAnswers = me.value?.answers || [];
    return userAnswers.length >= questions.length;
});

// Validasi jika belum terdaftar
if (!me.value && !mePending.value) {
    navigateTo(`/agendas/${agendaId}/committee/register`);
}

const bannerImage = computed(() => {
    if (agenda.value?.photos && agenda.value.photos.length > 0) {
        const firstPhoto = agenda.value.photos[0];
        return typeof firstPhoto?.image === 'string' ? firstPhoto.image : `/img/placeholder-banner-${Math.floor(Math.random() * 3) + 1}.jpeg`;
    }
    return `/img/placeholder-banner-${Math.floor(Math.random() * 3) + 1}.jpeg`;
});

// 2. Generate QR Code Content (For Display)
const qrContent = computed(() => {
    if (!me.value?._id) return '';
    return JSON.stringify({
        a: agendaId,
        c: me.value._id,
        t: 'c'
    });
});

const qrCode = ref('');
watch(qrContent, async (newContent) => {
    if (!newContent) return;
    try {
        const data = await $api<{ success: boolean, dataUrl: string }>('/api/tool/qr', {
            method: 'POST',
            body: { text: newContent }
        });
        if (data?.dataUrl) {
            qrCode.value = data.dataUrl;
        }
    } catch (e) {
        console.error('Failed to generate QR', e);
    }
}, { immediate: true });


// Helper untuk format tanggal
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

// --- ACTIONS ---
const doPayment = () => {
    // Navigate to payment page (reuse register flow or specific payment page if exists)
    // For committee, payment is usually part of registration flow step
    navigateTo(`/agendas/${agendaId}/committee/register?tab=payment`);
};

const doAnswer = () => {
    navigateTo(`/agendas/${agendaId}/committee/register?tab=answer_question`);
};

const isGeneratingPdf = ref(false);
const downloadTicket = async () => {
    if (!agenda.value || !me.value) return;

    isGeneratingPdf.value = true;
    try {
        await makeTicket(agenda.value, me.value, 'committee');
    } catch (e) {
        console.error("Gagal download tiket", e);
    } finally {
        isGeneratingPdf.value = false;
    }
};

const links = computed(() => [{
    label: 'Beranda',
    icon: 'i-heroicons-home',
    to: '/'
}, {
    label: 'Agenda',
    icon: 'i-heroicons-calendar',
    to: '/agendas'
}, {
    label: (agenda.value?.category as ICategory)?.title,
    icon: 'i-heroicons-tag',
    to: `/agendas/?categories=${(agenda.value?.category as ICategory)?._id}`
}, {
    label: agenda.value?.title,
    icon: 'i-heroicons-document-text',
    to: `/agendas/${agendaId}`
}, {
    label: 'Committee Info',
    icon: 'i-heroicons-user-group',
}]);

definePageMeta({
    layout: 'client',
    // auth: true, // Committee usually requires auth
});
</script>

<template>
    <div class="items-center justify-center mb-2 space-y-2">
        <UBreadcrumb :items="links" />
        <UCard class="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center font-sans">

            <div v-if="pending" class="flex flex-col items-center justify-center space-y-4">
                <span class="loading loading-dots loading-lg text-primary"></span>
                <p class="text-sm font-medium text-gray-500 animate-pulse">Memroses data panitia...</p>
            </div>

            <div v-else-if="error || !agenda" class="text-center max-w-md mx-auto">
                <div class="bg-red-50 text-red-600 rounded-2xl p-6 shadow-sm border border-red-100">
                    <Icon name="i-heroicons-exclamation-triangle" class="w-12 h-12 mx-auto mb-3" />
                    <h3 class="text-lg font-bold mb-1">Gagal Memuat Data</h3>
                    <p class="text-sm opacity-90 mb-6">Kami tidak dapat menemukan data agenda yang Anda cari.</p>
                    <UButton to="/agendas" color="error" variant="soft" block>Kembali ke Beranda</UButton>
                </div>
            </div>

            <div v-else class="w-full max-w-md relative perspective-1000">

                <!-- Warning Alerts -->
                <div v-if="!isPaid" class="mb-6 relative z-10">
                    <div class="bg-red-500 rounded-xl p-4 text-white space-y-2">
                        <div class="flex items-start gap-3">
                            <div class="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                <Icon name="i-heroicons-credit-card" class="w-6 h-6" />
                            </div>
                            <div class="flex-1">
                                <h3 class="font-bold text-sm">Menunggu Pembayaran</h3>
                                <p class="text-xs opacity-90 mt-1 leading-relaxed">
                                    Tiket belum aktif. Selesaikan pembayaran sebesar <span class="font-bold">Rp {{
                                        agenda.configuration?.committee?.amount?.toLocaleString() }}</span>
                                </p>
                            </div>
                        </div>
                        <UButton @click="doPayment" color="neutral" variant="solid" class="text-red-600" block>
                            Bayar Sekarang
                            <Icon name="i-heroicons-arrow-right" class="w-4 h-4" />
                        </UButton>
                    </div>
                </div>

                <div v-else-if="!isQuestionsAnswered" class="mb-6 relative z-10">
                    <div class="bg-yellow-500 rounded-xl p-4 text-white space-y-2">
                        <div class="flex items-start gap-3">
                            <div class="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                <Icon name="i-heroicons-document-text" class="w-6 h-6" />
                            </div>
                            <div class="flex-1">
                                <h3 class="font-bold text-sm">Data Belum Lengkap</h3>
                                <p class="text-xs opacity-90 mt-1 leading-relaxed">
                                    Panitia membutuhkan informasi tambahan dari Anda sebelum tiket dapat diterbitkan.
                                </p>
                            </div>
                        </div>
                        <UButton @click="doAnswer" color="warning" variant="solid" block>
                            Lengkapi Data
                            <Icon name="i-heroicons-arrow-right" class="w-4 h-4" />
                        </UButton>
                    </div>
                </div>

                <!-- Ticket Card -->
                <div v-else class="relative group">
                    <!-- Clean design without glow effects -->
                    <div class="relative bg-white dark:bg-gray-800 rounded-4xl shadow-2xl overflow-hidden">

                        <!-- Top Section: Visual & Header -->
                        <div class="h-64 relative bg-gray-900">
                            <NuxtImg provider="localProvider" :src="bannerImage"
                                class="w-full h-full object-cover opacity-80 mix-blend-overlay" alt="Banner" />
                            <div class="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-black/60 to-transparent">
                            </div>
                            <div class="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/40 to-transparent">
                            </div>

                            <!-- Event Info Overlay -->
                            <div class="absolute bottom-0 left-0 right-0 p-6">
                                <div class="flex items-center gap-2 mb-3">
                                    <span
                                        class="px-3 py-1 text-[10px] font-bold bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full uppercase tracking-wider shadow-sm">
                                        {{ (agenda.category as ICategory)?.title || 'Event' }}
                                    </span>
                                    <div
                                        class="px-3 py-1 text-[10px] font-bold bg-blue-500/20 backdrop-blur-md text-blue-300 border border-blue-500/30 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                                        <div class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                                        Committee
                                    </div>
                                </div>
                                <h1
                                    class="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-lg font-display mb-1">
                                    {{ agenda.title }}
                                </h1>
                                <div class="flex items-center text-gray-300 text-xs sm:text-sm font-medium gap-2 mt-2">
                                    <Icon name="i-heroicons-map-pin" class="w-4 h-4" />
                                    <span class="truncate max-w-[250px]">{{ agenda.at }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Middle Section: Ticket Details (Rip Effect) -->
                        <div class="relative bg-white dark:bg-gray-900">
                            <!-- Rip Circles -->
                            <div class="absolute -top-3 -left-3 w-6 h-6 bg-gray-50 dark:bg-gray-900 rounded-full z-20">
                            </div>
                            <div class="absolute -top-3 -right-3 w-6 h-6 bg-gray-50 dark:bg-gray-900 rounded-full z-20">
                            </div>
                            <div
                                class="absolute top-0 left-3 right-3 border-t-2 border-dashed border-gray-300 dark:border-gray-700 opacity-50">
                            </div>

                            <div class="px-6 py-8">
                                <!-- Detail Grid -->
                                <div class="grid grid-cols-2 gap-6 mb-8">
                                    <div class="space-y-1">
                                        <p class="text-xs uppercase tracking-wider text-gray-400 font-semibold">Tanggal
                                        </p>
                                        <p class="text-sm font-bold text-gray-800 dark:text-gray-100">
                                            {{ formatDate(new Date(agenda.date.start).toISOString()) }}
                                        </p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-xs uppercase tracking-wider text-gray-400 font-semibold">Waktu
                                        </p>
                                        <p class="text-sm font-bold text-gray-800 dark:text-gray-100">
                                            {{ formatTime(new Date(agenda.date.start).toISOString()) }} WIB
                                        </p>
                                    </div>
                                    <div class="space-y-1 col-span-2">
                                        <p class="text-xs uppercase tracking-wider text-gray-400 font-semibold">Panitia
                                        </p>
                                        <div class="flex items-center gap-3">
                                            <div
                                                class="w-8 h-8 rounded-full bg-linear-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                                                {{ (me?.member as IMember)?.fullName?.charAt(0) || 'C' }}
                                            </div>
                                            <div>
                                                <p
                                                    class="text-sm font-bold text-gray-800 dark:text-gray-100 line-clamp-1">
                                                    {{ (me?.member as IMember)?.fullName || 'Panitia' }}
                                                </p>
                                                <p class="text-[10px] text-gray-500 font-mono">
                                                    Job: {{ me?.job || '-' }}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- QR Code Section -->
                                <div
                                    class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center relative group-hover:border-primary-200 transition-colors duration-300">
                                    <div class="bg-white p-3 rounded-xl shadow-sm mb-4">
                                        <img :src="qrCode" class="w-40 h-40 object-contain" alt="QR Code" />
                                    </div>
                                    <div class="text-center">
                                        <p class="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">Scan saat
                                            masuk
                                        </p>
                                        <div v-if="me?.visiting"
                                            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold mt-2">
                                            <Icon name="i-heroicons-check-badge-solid" class="w-4 h-4" />
                                            Sudah Check-in
                                        </div>
                                        <div v-else
                                            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-bold mt-2">
                                            <Icon name="i-heroicons-clock" class="w-4 h-4" />
                                            Belum Check-in
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <!-- Footer Actions -->
                        <div
                            class="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex gap-3 border-t border-gray-100 dark:border-gray-800">
                            <UButton @click="downloadTicket" :loading="isGeneratingPdf" color="neutral" variant="solid"
                                class="flex-1 justify-center font-bold" icon="i-heroicons-arrow-down-tray">
                                Unduh Tiket (PDF)
                            </UButton>
                            <UButton to="/agendas" color="neutral" variant="solid" class="justify-center"
                                icon="i-heroicons-home">
                                Kembali
                            </UButton>
                        </div>
                    </div>

                    <p class="text-center text-xs text-gray-400 mt-6 md:hidden">
                        Tunjukkan tiket ini kepada panitia saat registrasi ulang.
                    </p>
                </div>
            </div>
        </UCard>
    </div>
</template>
