<script setup lang='ts'>
import type { ICategory } from '~~/types';
import type { IAgendaResponse } from '~~/types/IResponse';

definePageMeta({
    layout: 'dashboard',
    middleware: ['sidebase-auth', 'organizer']
});

const route = useRoute();
const id = route.params.id as string;
const { $api, $ts } = useNuxtApp();
const config = useRuntimeConfig();

// Fetch Data
const { data: agenda, pending, refresh } = await useAsyncData('admin-agenda-detail',
    () => $api<IAgendaResponse>('/api/agenda', { query: { id } }), {
    transform: (data) => data.data?.agenda
});

// --- STATISTIK COMPUTED ---

const stats = computed(() => {
    if (!agenda.value) return [];

    const participants = agenda.value.participants || [];
    const committees = agenda.value.committees || [];

    // 1. Peserta
    const totalParticipants = participants.length;
    const paidParticipants = participants.filter(p => p.payment?.status === 'success').length;

    // 2. Panitia
    const totalCommittees = committees.length;
    const approvedCommittees = committees.filter(c => c.approved).length;

    // 3. Keuangan (Estimasi Kasar)
    // Hitung dari participant yang success
    const incomeParticipant = participants
        .filter(p => p.payment?.status === 'success')
        .reduce((sum, p) => sum + (agenda.value?.configuration.participant.amount || 0), 0);

    const incomeCommittee = committees
        .filter(c => c.payment?.status === 'success')
        .reduce((sum, c) => sum + (agenda.value?.configuration.committee.amount || 0), 0);

    const totalIncome = incomeParticipant + incomeCommittee;

    return [
        {
            label: 'Total Peserta',
            value: totalParticipants,
            desc: `${paidParticipants} Lunas`,
            icon: 'i-heroicons-users',
            color: 'blue'
        },
        {
            label: 'Total Panitia',
            value: totalCommittees,
            desc: `${approvedCommittees} Diterima`,
            icon: 'i-heroicons-user-group',
            color: 'orange'
        },
        {
            label: 'Estimasi Pemasukan',
            value: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalIncome),
            desc: 'Dari Pembayaran Valid',
            icon: 'i-heroicons-banknotes',
            color: 'green'
        }
    ];
});

// --- NAVIGATION LINKS ---
const shortcuts = [
    {
        label: 'Edit Agenda',
        desc: 'Ubah info dasar, tanggal, & deskripsi',
        icon: 'i-heroicons-pencil-square',
        to: `/administrator/agendas/${id}/edit`,
        color: 'primary'
    },
    {
        label: 'Data Peserta',
        desc: 'Kelola pendaftaran & presensi peserta',
        icon: 'i-heroicons-users',
        to: `/administrator/agendas/${id}/participant`,
        color: 'secondary'
    },
    {
        label: 'Data Panitia',
        desc: 'Seleksi & manajemen panitia',
        icon: 'i-heroicons-briefcase',
        to: `/administrator/agendas/${id}/committee`,
        color: 'secondary'
    },
    {
        label: 'Scanner Presensi',
        desc: 'Buka kamera untuk scan tiket',
        icon: 'i-heroicons-qr-code',
        to: `/administrator/agendas/${id}/scan`, // Asumsi route
        color: 'neutral'
    }
];

const links = computed(() => [
    { label: $ts('dashboard'), to: '/dashboard', icon: 'i-heroicons-home' },
    { label: $ts('administrator'), icon: 'i-heroicons-shield-check' },
    { label: 'Agendas', to: '/administrator/agendas', icon: 'i-heroicons-calendar' },
    { label: agenda.value?.title || 'Detail', icon: 'i-heroicons-document-text' }
]);
const shareAgenda = () => {
    if (navigator.share) {
        navigator.share({
            title: agenda.value?.title,
            text: agenda.value?.description,
            url: window.location.href
        });
    } else {
        // Fallback copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        useToast().add({ title: 'Link disalin ke clipboard' });
    }
};
const publicLink = computed(() => `/agendas/${id}`);

</script>

<template>
    <div class="space-y-6">
        <UBreadcrumb :items="links" />

        <div v-if="pending" class="flex justify-center py-10">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-primary" />
        </div>

        <div v-else-if="agenda" class="space-y-6">

            <div
                class="bg-white/30 dark:bg-gray-800/40 p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between md:items-center gap-4 rounded-2xl">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {{ agenda.title }}
                        <UBadge v-if="agenda.category" color="primary" variant="subtle" size="xs">
                            {{ (agenda.category as ICategory)?.title || 'Tidak Berkategori' }}
                        </UBadge>
                    </h1>
                    <p class="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 text-sm">
                        <UIcon name="i-heroicons-calendar" />
                        {{ new Date(agenda.date.start as string).toLocaleDateString('id-ID', { dateStyle: 'long' }) }}
                        <span class="mx-1">•</span>
                        <UIcon name="i-heroicons-map-pin" />
                        {{ agenda.at }}
                    </p>
                </div>
                <div class="flex gap-2">
                    <UButton :to="publicLink" target="_blank" color="neutral" variant="ghost"
                        icon="i-heroicons-arrow-top-right-on-square">
                        Lihat Publik
                    </UButton>
                    <UButton icon="i-heroicons-share" variant="soft" color="neutral" @click="shareAgenda">
                        Bagikan
                    </UButton>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <UCard v-for="(stat, idx) in stats" :key="idx">
                    <div class="flex items-center gap-4">
                        <div
                            :class="`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/30 text-${stat.color}-500`">
                            <UIcon :name="stat.icon" class="w-6 h-6" />
                        </div>
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">{{ stat.label }}</p>
                            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stat.value }}</p>
                            <p class="text-xs text-gray-400">{{ stat.desc }}</p>
                        </div>
                    </div>
                </UCard>
            </div>

            <div>
                <h3 class="text-lg font-semibold mb-3">Manajemen Agenda</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <NuxtLink v-for="(menu, i) in shortcuts" :key="i" :to="menu.to" class="block group">
                        <UCard class="h-full hover:ring-2 hover:ring-primary-500/50 transition-all cursor-pointer"
                            :ui="{ body: 'p-4 sm:p-5' }">
                            <div class="flex items-start gap-4">
                                <UAvatar :icon="menu.icon"
                                    :class="`bg-${menu.color}-100 dark:bg-${menu.color}-900 text-${menu.color}-500`"
                                    size="md" />
                                <div>
                                    <h4
                                        class="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                        {{ menu.label }}
                                    </h4>
                                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {{ menu.desc }}
                                    </p>
                                </div>
                                <UIcon name="i-heroicons-chevron-right"
                                    class="ml-auto text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                        </UCard>
                    </NuxtLink>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UCard>
                    <template #header>
                        <h3 class="font-semibold flex items-center gap-2">
                            <UIcon name="i-heroicons-qr-code" /> QR Code Agenda
                        </h3>
                    </template>
                    <div class="flex flex-col items-center justify-center py-4">
                        <Qrcode :value="id" :size="200" level="H" class="bg-white p-2 rounded-lg" />
                        <p class="text-sm text-gray-500 mt-4 text-center max-w-xs">
                            Gunakan QR ini untuk presensi peserta. Peserta dapat memindai ini melalui aplikasi scanner
                            mereka.
                        </p>
                        <UButton class="mt-4" icon="i-heroicons-printer" size="sm" variant="soft">Cetak QR Code
                        </UButton>
                    </div>
                </UCard>

                <UCard>
                    <template #header>
                        <h3 class="font-semibold flex items-center gap-2">
                            <UIcon name="i-heroicons-cog-6-tooth" /> Konfigurasi Cepat
                        </h3>
                    </template>
                    <div class="space-y-4">
                        <div
                            class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <div>
                                <p class="text-sm font-medium">Buka Pendaftaran Peserta</p>
                                <p class="text-xs text-gray-500">Izinkan peserta baru mendaftar</p>
                            </div>
                            <USwitch :model-value="agenda.configuration.participant.canRegister !== 'None'" disabled />
                        </div>
                        <div
                            class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <div>
                                <p class="text-sm font-medium">Pendaftaran Berbayar</p>
                                <p class="text-xs text-gray-500">{{ agenda.configuration.participant.pay ? 'Aktif' :
                                    'Gratis' }}</p>
                            </div>
                            <UIcon
                                :name="agenda.configuration.participant.pay ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                                :class="agenda.configuration.participant.pay ? 'text-green-500' : 'text-gray-400'" />
                        </div>

                        <UButton :to="`/administrator/agendas/${id}/edit`" block variant="outline" class="mt-4">
                            Ubah Konfigurasi Lengkap
                        </UButton>
                    </div>
                </UCard>
            </div>

        </div>
    </div>
</template>