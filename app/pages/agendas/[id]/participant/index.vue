<script setup lang="ts">
import { ModalsParticipantUpdateEmail } from '#components';
import { useQRCode } from '@vueuse/integrations/useQRCode';
import type { ICategory, IGuest, IMember } from '~~/types';
import { type IAgendaResponse, type IParticipantResponse } from '~~/types/IResponse';

const route = useRoute();
const toast = useToast();
const { $api, $ts } = useNuxtApp();
const agendaId = route.params.id as string;
const participantIdFromCookie = useCookie(`agenda-participant-${agendaId}`, { maxAge: 60 * 60 * 24 * 30 });
const participantIdQuery = route.query.participantId as string || participantIdFromCookie.value;
const { makeTicket } = useMakeDocs();
const overlay = useOverlay();
const UpdateEmailModal = overlay.create(ModalsParticipantUpdateEmail);

// 1. Fetch Agenda Data & Registration Status
const { data: agenda, pending, error } = useLazyAsyncData(`agenda-${agendaId}`, () => $api<IAgendaResponse>(`/api/agenda/${agendaId}`), {
    transform: (data) => {
        if (!data.data) return null;
        return data.data.agenda;
    },
    default: () => null,
});
const { data: me, pending: mePending, error: meError, refresh } = useLazyAsyncData(`registration-${agendaId}`, () => $api<IParticipantResponse>(`/api/agenda/${agendaId}/participant/me`, {
    query: { participantId: participantIdQuery }
}), {
    transform: (data) => {
        if (!data.data) return null;
        // Simpan participantId ke cookie jika ada
        if (data.data.participant._id) {
            participantIdFromCookie.value = data.data.participant._id as string;
        }
        return data.data.participant;
    },
    default: () => null,
});

// Cek Status Pembayaran
const isPaymentRequired = computed(() => {
    if (!agenda.value || !me.value) return false;
    const agendaConfig = agenda.value.configuration?.participant;
    return agendaConfig?.pay;
});

const isPaid = computed(() => {
    if (!isPaymentRequired.value) return true;
    const status = me.value?.payment?.status;
    return status === 'success';
});

const manualPaymentTarget = computed(() => {
    if (me.value?.payment?.method !== 'manual_transfer') return null;
    return agenda.value?.configuration?.manualPayments?.find(p => p.name === me.value?.payment?.manual_target);
});

const fileInputRef = ref<HTMLInputElement | null>(null);
const isUploadingProof = ref(false);
const handleProofUpload = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    isUploadingProof.value = true;

    if (!file) {
        toast.add({ title: 'Gagal', description: 'File tidak ditemukan', color: 'error' });
        isUploadingProof.value = false;
        return;
    }

    if (file.size > 1024 * 1024 * 5) {
        toast.add({ title: 'Gagal', description: 'File terlalu besar', color: 'error' });
        isUploadingProof.value = false;
        return;
    }

    try {
        const formData = new FormData();
        formData.append('proof', file);

        const res = await $api<any>(`/api/agenda/${agendaId}/payment/${me.value?._id}/proof`, {
            method: 'POST',
            body: formData,
        });

        if (res.statusCode === 200) {
            toast.add({ title: 'Sukses', description: 'Bukti pembayaran berhasil diunggah', color: 'success' });
            refresh();
        }
    } catch (err: any) {
        toast.add({ title: 'Gagal', description: err.response?.data?.statusMessage || 'Gagal mengunggah bukti pembayaran', color: 'error' });
    } finally {
        isUploadingProof.value = false;
        input.value = '';
    }
};

// Cek Status Jawaban
const isQuestionsAnswered = computed(() => {
    const questions = agenda.value?.configuration?.participant.questions || [];
    if (questions.length === 0) return true;
    const userAnswers = me.value?.answers || [];
    return userAnswers.length >= questions.length;
});

// Resolve ticket model
const myTicketModel = computed(() => {
    if (!me.value?.ticketModelId || !agenda.value) return null;
    const models = agenda.value.configuration?.participant?.ticketModels || [];
    return models.find((m: any) => (m._id?.toString() || m.name) === me.value?.ticketModelId) || null;
});

// Validasi jika belum terdaftar
watch([me, mePending, agenda, pending, meError, error], ([newMe, isMePending, newAgenda, isAgendaPending, newMeError, newAgendaError]) => {
    // Jangan redirect jika ada error dari sistem/jaringan
    if (newAgendaError) return;

    // Pastikan agenda selesai dimuat dan ada datanya
    if (!isAgendaPending && newAgenda) {
        // Asumsi data tidak valid/tidak ditemukan jika null dan (tidak ada error HTTP/jaringan atau errornya 404)
        const isParticipantNotFound = !newMe && (!newMeError || (newMeError as any).statusCode === 404 || (newMeError as any).response?.status === 404);

        if (!isMePending && isParticipantNotFound && isVerified.value) {
            // Hapus cookie jika pendaftaran tidak valid/ditemukan
            participantIdFromCookie.value = null;
            navigateTo(`/agendas/${agendaId}/participant/register?tab=register&participantId=${route.query.participantId || ''}`);
        }
    }
});

const isVerified = ref(!!participantIdFromCookie.value || !route.query.participantId);
const verificationEmail = ref('');
const isVerifying = ref(false);

const verifyEmail = async () => {
    if (!verificationEmail.value) return;
    isVerifying.value = true;
    try {
        const res = await $api<any>(`/api/agenda/${agendaId}/participant/${participantIdQuery}/verify`, {
            method: 'POST',
            body: { email: verificationEmail.value }
        });
        if (res.statusCode === 200) {
            isVerified.value = true;
            participantIdFromCookie.value = participantIdQuery;
            refresh();
            toast.add({ title: 'Sukses', description: 'Email berhasil diverifikasi', color: 'success' });
        }
    } catch (e: any) {
        toast.add({ title: 'Gagal', description: e.response?.data?.statusMessage || 'Email tidak cocok dengan data pendaftaran', color: 'error' });
    } finally {
        isVerifying.value = false;
    }
};

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
        p: me.value._id,
        t: 'p'
    });
});

const qrCode = useQRCode(qrContent, {
    errorCorrectionLevel: 'H',
    margin: 2,
    scale: 10,
    color: {
        dark: '#000000',
        light: '#ffffff',
    },
});

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
    navigateTo(`/agendas/${agendaId}/participant/register?tab=select_payment&participantId=${me.value?._id}`);
};

const doAnswer = () => {
    navigateTo(`/agendas/${agendaId}/participant/register?tab=answer_question&participantId=${me.value?._id}`);
};

const isGeneratingPdf = ref(false);
const downloadTicket = async () => {
    if (!agenda.value || !me.value) return;

    isGeneratingPdf.value = true;
    try {
        // Tentukan Role (Logic sederhana, bisa dikembangkan)
        // Disini kita pass hardcoded 'participant' dulu sesuai request,
        // tapi 'makeTicket' support 'committee' juga.
        await makeTicket(agenda.value, me.value, 'participant');
    } catch (e) {
        console.error("Gagal download tiket", e);
    } finally {
        isGeneratingPdf.value = false;
    }
};

const openUpdateEmailModal = () => {
    if (!me.value) return;
    UpdateEmailModal.open({
        initialEmail: (me.value.guest as IGuest)?.email || '',
        agendaId: agendaId,
        participantId: me.value._id as string,
        onSuccess: (newEmail: string) => {
            if (me.value && me.value.guest) {
                (me.value.guest as IGuest).email = newEmail;
            }
        }
    });
};

const links = computed(() => [{
    label: $ts('home'),
    icon: 'i-heroicons-home',
    to: '/'
}, {
    label: $ts('agenda'),
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
    label: $ts('registered'),
    icon: 'i-heroicons-user',
}]);

definePageMeta({
    layout: 'client',
    auth: false
});
</script>

<template>
    <div class="items-center justify-center mb-2 space-y-2">
        <UBreadcrumb :items="links" />
        <UCard class="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center font-sans">

            <!-- Verifikasi Email Form -->
            <div v-if="!isVerified" class="w-full max-w-md mx-auto">
                <div
                    class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 ring-1 ring-gray-200 dark:ring-gray-700">
                    <div class="flex flex-col items-center text-center mb-8">
                        <div class="bg-primary-50 dark:bg-primary-900/30 p-4 rounded-full mb-4">
                            <UIcon name="i-heroicons-lock-closed" class="w-8 h-8 text-primary-500" />
                        </div>
                        <h2 class="text-2xl font-black text-gray-900 dark:text-white">Verifikasi Keamanan</h2>
                        <p class="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                            Masukkan email yang Anda gunakan saat mendaftar untuk mengakses tiket ini.
                        </p>
                    </div>

                    <form @submit.prevent="verifyEmail" class="space-y-6">
                        <UFormField label="Alamat Email" required>
                            <UInput v-model="verificationEmail" type="email" placeholder="email@contoh.com"
                                icon="i-heroicons-envelope" size="lg" />
                        </UFormField>
                        <UButton type="submit" :loading="isVerifying" color="primary" block size="lg"
                            icon="i-heroicons-shield-check">
                            Verifikasi Tiket
                        </UButton>
                    </form>
                </div>
            </div>

            <!-- Ticket View -->
            <div v-else-if="pending || mePending" class="w-full max-w-md mx-auto space-y-4">
                <div class="bg-white dark:bg-gray-800 rounded-4xl shadow-2xl overflow-hidden">
                    <USkeleton class="h-64 w-full rounded-none" />
                    <div class="p-6 space-y-6">
                        <div class="grid grid-cols-2 gap-6">
                            <USkeleton class="h-10 w-full" />
                            <USkeleton class="h-10 w-full" />
                            <USkeleton class="h-12 w-full col-span-2" />
                        </div>
                        <USkeleton class="h-48 w-full rounded-2xl" />
                        <div class="flex gap-3">
                            <USkeleton class="h-10 flex-1 rounded-xl" />
                            <USkeleton class="h-10 flex-1 rounded-xl" />
                        </div>
                    </div>
                </div>
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
                    <div v-if="me?.payment?.method === 'manual_transfer'"
                        class="bg-primary-500 rounded-xl p-4 md:p-6 text-white shadow-lg space-y-4">
                        <div v-if="me?.payment?.status === 'verifying'" class="flex items-center gap-3">
                            <div class="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                <Icon name="i-heroicons-clock" class="w-6 h-6 animate-pulse" />
                            </div>
                            <div class="flex-1">
                                <h3 class="font-bold">Sedang Diverifikasi</h3>
                                <p class="text-sm opacity-90 mt-1">Panitia sedang mengecek bukti pembayaran Anda. Harap
                                    tunggu beberapa saat.</p>
                            </div>
                        </div>
                        <div v-else class="space-y-4">
                            <div class="flex items-start gap-3">
                                <div class="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                    <Icon name="i-heroicons-banknotes" class="w-6 h-6" />
                                </div>
                                <div class="flex-1">
                                    <h3 class="font-bold text-lg mb-1">Transfer Manual</h3>
                                    <p class="text-sm opacity-90">Selesaikan pembayaran sebesar <span
                                            class="font-bold text-lg">Rp {{
                                                agenda?.configuration?.participant?.amount?.toLocaleString() }}</span></p>

                                    <div v-if="manualPaymentTarget"
                                        class="mt-4 bg-black/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                                        <p class="text-xs opacity-75 mb-1 uppercase tracking-wider">Tujuan Transfer:</p>
                                        <p class="font-bold text-lg">{{ manualPaymentTarget.name }} - {{
                                            manualPaymentTarget.account }}</p>
                                        <p class="text-sm">A.N. {{ manualPaymentTarget.owner }}</p>
                                        <p v-if="manualPaymentTarget.instructions"
                                            class="text-xs mt-2 italic flex items-center gap-1">
                                            <Icon name="i-heroicons-information-circle" class="w-4 h-4" /> {{
                                                manualPaymentTarget.instructions }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div class="pt-2 flex flex-col sm:flex-row gap-3">
                                <input type="file" ref="fileInputRef" class="hidden" accept="image/*"
                                    @change="handleProofUpload" />
                                <UButton color="neutral" variant="solid" block :loading="isUploadingProof"
                                    @click="() => fileInputRef?.click()">
                                    <template #leading>
                                        <Icon name="i-heroicons-arrow-up-tray" class="w-4 h-4" />
                                    </template>
                                    Upload Bukti Transfer
                                </UButton>
                            </div>
                        </div>
                    </div>
                    <div v-else class="bg-red-500 rounded-xl p-4 text-white space-y-2">
                        <div class="flex items-start gap-3">
                            <div class="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                <Icon name="i-heroicons-credit-card" class="w-6 h-6" />
                            </div>
                            <div class="flex-1">
                                <h3 class="font-bold text-sm">Menunggu Pembayaran</h3>
                                <p class="text-xs opacity-90 mt-1 leading-relaxed">
                                    Tiket belum aktif. Selesaikan pembayaran sebesar <span class="font-bold">Rp {{
                                        agenda?.configuration?.participant?.amount?.toLocaleString() }}</span>
                                </p>
                            </div>
                        </div>
                        <UButton @click="doPayment" color="error" variant="solid" block>
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
                <div v-else class="relative group perspective-1000">
                    <!-- Clean design with glassmorphism and subtle glow -->
                    <div
                        class="relative bg-white/90 dark:bg-gray-900/80 backdrop-blur-2xl rounded-4xl shadow-lg overflow-hidden ring-1 ring-gray-200/50 dark:ring-gray-700/50 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,141,211,0.3)] transition-all duration-700 ease-out">

                        <!-- Top Section: Visual & Header -->
                        <div class="h-64 relative bg-gray-900">
                            <NuxtImg provider="localProvider" :src="bannerImage"
                                class="w-full h-full object-cover opacity-80 mix-blend-overlay" alt="Banner" />
                            <div class="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-black/60 to-transparent">
                            </div>
                            <div class="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/40 to-transparent">
                            </div>

                            <!-- Logos Overlay (Top Right) -->
                            <div class="absolute top-4 right-4 flex gap-2 z-10">
                                <div
                                    class="bg-white/20 backdrop-blur-md p-1.5 rounded-full ring-1 ring-white/30 shadow-lg shadow-black/20">
                                    <NuxtImg provider="localProvider" src="/img/itsnu-logo.png" alt="ITSNU Logo"
                                        class="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-md" />
                                </div>
                                <div
                                    class="bg-white/20 backdrop-blur-md p-1.5 rounded-full ring-1 ring-white/30 shadow-lg shadow-black/20">
                                    <NuxtImg provider="localProvider" src="/img/logo.png" alt="HIMATIKA Logo"
                                        class="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-md" />
                                </div>
                            </div>

                            <!-- Event Info Overlay -->
                            <div class="absolute bottom-0 left-0 right-0 p-6">
                                <div class="flex items-center gap-2 mb-3">
                                    <span
                                        class="px-3 py-1 text-[10px] font-bold bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full uppercase tracking-wider shadow-sm">
                                        {{ (agenda.category as ICategory)?.title || 'Event' }}
                                    </span>
                                    <div
                                        class="px-3 py-1 text-[10px] font-bold bg-green-500/20 backdrop-blur-md text-green-300 border border-green-500/30 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                                        <div class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                                        Confirmed
                                    </div>
                                    <div v-if="myTicketModel"
                                        class="px-3 py-1 text-[10px] font-bold backdrop-blur-md border rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1"
                                        :class="myTicketModel.meetLink ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'">
                                        <UIcon
                                            :name="myTicketModel.meetLink ? 'i-heroicons-video-camera' : 'i-heroicons-map-pin'"
                                            class="w-3 h-3" />
                                        {{ myTicketModel.name }}
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
                        <div
                            class="relative bg-white/60 dark:bg-gray-900/40 border-t border-gray-100/50 dark:border-gray-800/50 backdrop-blur-xl">
                            <!-- Rip Circles -->
                            <div
                                class="absolute -top-4 -left-4 w-8 h-8 bg-gray-50 dark:bg-gray-900 rounded-full z-20 shadow-[inset_-3px_-3px_5px_rgba(0,0,0,0.1)] dark:shadow-[inset_-3px_-3px_5px_rgba(255,255,255,0.05)]">
                            </div>
                            <div
                                class="absolute -top-4 -right-4 w-8 h-8 bg-gray-50 dark:bg-gray-900 rounded-full z-20 shadow-[inset_3px_-3px_5px_rgba(0,0,0,0.1)] dark:shadow-[inset_3px_-3px_5px_rgba(255,255,255,0.05)]">
                            </div>
                            <div
                                class="absolute top-0 left-4 right-4 border-t-[3px] border-dashed border-gray-300 dark:border-gray-700 opacity-60">
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
                                        <p class="text-xs uppercase tracking-wider text-gray-400 font-semibold">Peserta
                                        </p>
                                        <div class="flex items-center gap-3">
                                            <div
                                                class="w-8 h-8 rounded-full bg-linear-to-tr from-primary-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                                                {{ ((me?.member as IMember)?.fullName || (me?.guest as IGuest)?.fullName
                                                    || 'Peserta').charAt(0).toUpperCase() }}
                                            </div>
                                            <div>
                                                <p
                                                    class="text-sm font-bold text-gray-800 dark:text-gray-100 line-clamp-1">
                                                    {{ (me?.member as IMember)?.fullName || (me?.guest as
                                                        IGuest)?.fullName || 'Peserta' }}
                                                </p>
                                                <p class="text-[10px] text-gray-500 font-mono">
                                                    ID: {{ (me?._id as string)?.slice(-8).toUpperCase() }}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- QR Code Section -->
                                <div
                                    class="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/80 dark:to-gray-900/80 rounded-3xl p-6 ring-1 ring-gray-200/50 dark:ring-gray-700/50 shadow-inner flex flex-col items-center justify-center relative group-hover:ring-primary-500/50 group-hover:shadow-[0_0_30px_rgba(0,141,211,0.15)] transition-all duration-500">
                                    <div
                                        class="bg-white p-3 rounded-2xl shadow-[0_8px_24px_-8px_rgba(0,0,0,0.15)] mb-4 transition-transform duration-500 group-hover:scale-105">
                                        <img :src="qrCode" class="w-40 h-40 object-contain mix-blend-multiply"
                                            alt="QR Code" />
                                    </div>
                                    <div class="text-center">
                                        <p class="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">Scan saat
                                            masuk
                                        </p>
                                        <div v-if="me?.visiting"
                                            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 text-white text-sm font-bold mt-2 shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-pulse ring-1 ring-green-400/50">
                                            <Icon name="i-heroicons-check-badge-solid" class="w-5 h-5" />
                                            TERVERIFIKASI HADIR
                                        </div>
                                        <div v-else
                                            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-500 dark:text-gray-400 text-xs font-bold mt-2 ring-1 ring-inset ring-gray-200 dark:ring-gray-700">
                                            <Icon name="i-heroicons-clock" class="w-4 h-4" />
                                            Belum Check-in
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <!-- Sponsor Section Web Ticket -->
                        <div v-if="agenda.configuration?.sponsors?.length"
                            class="bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100/50 dark:border-gray-800/50 px-6 py-4 flex items-center gap-4 justify-center flex-wrap">
                            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Supported
                                By:</span>
                            <div class="flex items-center gap-4">
                                <NuxtImg provider="localProvider"
                                    v-for="(sponsor, idx) in agenda.configuration.sponsors" :key="idx"
                                    :src="(sponsor.logo as string)" :alt="sponsor.name"
                                    class="h-6 w-auto object-contain grayscale opacity-60" />
                            </div>
                        </div>

                        <!-- Footer Actions -->
                        <div
                            class="bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md px-6 py-4 flex flex-col gap-3 border-t border-gray-100/50 dark:border-gray-800/50">
                            <!-- Meet Link Button (Daring ticket) -->
                            <UButton v-if="myTicketModel?.meetLink && isPaid"
                                :to="`/api/agenda/${agendaId}/participant/${me?._id}/meet`" target="_blank"
                                color="primary" variant="solid" class="justify-center font-bold"
                                icon="i-heroicons-video-camera" block>
                                Gabung Pertemuan (Zoom/Meet)
                            </UButton>
                            <div class="flex gap-3">
                                <UButton @click="downloadTicket" :loading="isGeneratingPdf" color="neutral"
                                    variant="solid" class="flex-1 justify-center font-bold"
                                    icon="i-heroicons-arrow-down-tray">
                                    Unduh Tiket (PDF)
                                </UButton>
                                <UButton to="/agendas" color="neutral" variant="solid" class="justify-center"
                                    icon="i-heroicons-home">
                                    Kembali
                                </UButton>
                            </div>
                            <div v-if="me?.guest" class="text-center mt-2">
                                <p class="text-xs text-gray-500">
                                    Tidak menerima email tiket? <button @click="openUpdateEmailModal"
                                        class="text-primary-500 hover:underline">Ubah Email Anda</button>
                                </p>
                            </div>
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
