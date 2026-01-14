<script setup lang='ts'>
import { type ICategory } from '~~/types';
import { type IAgendaResponse } from '~~/types/IResponse';

// Page Meta
definePageMeta({
    layout: "client",
    auth: false
});

// Routing & Utils
const route = useRoute();
const id = route.params.id as string;
const { $api, $ts } = useNuxtApp();
const router = useRouter();

// Data Fetching
const { data: agenda, pending, refresh } = await useAsyncData('agenda',
    () => $api<IAgendaResponse>('/api/agenda', { query: { id } }), {
    transform: (data) => data.data?.agenda
});

// Auth & Permissions
const { data: user } = useAuth();
const organizerStore = useOrganizerStore();
const { isOrganizer } = storeToRefs(organizerStore);

// Logic Composable (Existing)
const {
    isRegistered,
    registeredId,
    canMeRegisterAsParticipant,
    canMeRegisterAsCommittee,
    isCommittee
} = useAgendas(agenda);

// --- COMPUTED PROPERTIES UNTUK UI ---

// 1. Banner Image (Ambil dari foto pertama atau placeholder)
const bannerImage = computed(() => {
    if (agenda.value?.photos && agenda.value.photos.length > 0) {
        const firstPhoto = agenda.value.photos[0];
        // Pastikan tipe image adalah string URL
        return typeof firstPhoto?.image === 'string' ? firstPhoto.image : `/img/placeholder-banner-${Math.floor(Math.random() * 3) + 1}.jpeg`;
    }
    return `/img/placeholder-banner-${Math.floor(Math.random() * 3) + 1}.jpeg`;
});

// 2. Date Formatting (Handling DatePickerRangeObject)
const formattedDate = computed(() => {
    if (!agenda.value?.date) return 'Tanggal belum ditentukan';
    const start = new Date(agenda.value.date.start);
    const end = new Date(agenda.value.date.end);

    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    };

    if (start.toDateString() === end.toDateString()) {
        return start.toLocaleDateString('id-ID', options);
    }
    return `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('id-ID', options)}`;
});

type EventStatus = {
    label: string;
    color: 'secondary' | 'success' | 'neutral';
    icon: string;
};
// 3. Event Status
const eventStatus = computed<EventStatus | null>(() => {
    if (!agenda.value?.date) return null;
    const now = new Date();
    const start = new Date(agenda.value.date.start);
    const end = new Date(agenda.value.date.end);

    if (now < start) return { label: 'Akan Datang', color: 'secondary', icon: 'i-heroicons-calendar' };
    if (now >= start && now <= end) return { label: 'Sedang Berlangsung', color: 'success', icon: 'i-heroicons-play-circle' };
    return { label: 'Selesai', color: 'neutral', icon: 'i-heroicons-check-circle' };
});

// 4. Price Logic
const priceLabel = computed(() => {
    const participantConfig = agenda.value?.configuration?.participant;
    if (!participantConfig?.pay) return 'GRATIS';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(participantConfig.amount);
});

// 5. Maps Link
const mapsLink = computed(() => agenda.value?.atLink || null);

// --- ACTIONS ---

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

const navigateToRegisterParticipant = () => {
    if (!user.value && agenda.value?.configuration.participant.canRegister !== 'Public') {
        router.push({ path: '/login', query: { redirect: route.fullPath } });
    } else {
        router.push(`/agendas/${id}/participant/register`);
    }
};

const navigateToRegisterCommittee = () => {
    if (!user.value) {
        router.push({ path: '/login', query: { redirect: route.fullPath } });
    } else {
        router.push(`/agendas/${id}/committee/register`);
    }
};

// --- SEO ---
useSeoMeta({
    title: () => agenda.value?.title || 'Detail Agenda',
    ogTitle: () => agenda.value?.title,
    description: () => agenda.value?.description?.substring(0, 160) || '',
    ogImage: () => bannerImage.value,
});
</script>

<template>
    <div>
        <div v-if="pending" class="flex h-screen items-center justify-center">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-primary" />
        </div>

        <div v-else-if="agenda" class="pb-20 md:pb-10 font-sans">

            <div class="relative h-[400px] lg:h-[500px] w-full overflow-hidden bg-gray-900 group rounded-2xl">
                <NuxtImg :src="bannerImage" provider="localProvider"
                    class="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm scale-105 transition-transform duration-700 group-hover:scale-110"
                    alt="Banner" />
                <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>

                <div
                    class="absolute inset-0 container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 z-10">
                    <div class="mb-4">
                        <UBadge v-if="eventStatus" :color="eventStatus.color" variant="solid" size="md"
                            class="rounded-full px-4">
                            <UIcon :name="eventStatus.icon" class="mr-2" /> {{ eventStatus.label }}
                        </UBadge>
                    </div>

                    <h1 class="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
                        {{ agenda.title }}
                    </h1>

                    <div class="flex flex-wrap gap-3 text-sm font-medium text-gray-100">
                        <div
                            class="flex items-center gap-2 bg-white/30/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                            <UIcon name="i-heroicons-calendar-days" class="text-primary-400 w-5 h-5" />
                            <span>{{ formattedDate }}</span>
                        </div>
                        <div
                            class="flex items-center gap-2 bg-white/30/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                            <UIcon name="i-heroicons-map-pin" class="text-red-400 w-5 h-5" />
                            <span>{{ agenda.at }}</span>
                        </div>
                        <div v-if="agenda.category"
                            class="flex items-center gap-2 bg-white/30/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                            <UIcon name="i-heroicons-tag" class="text-yellow-400 w-5 h-5" />
                            <span>{{ (agenda.category as ICategory)?.title }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="container mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    <div class="lg:col-span-2 space-y-8">

                        <div class="bg-white/30 dark:bg-gray-800/40 rounded-2xl shadow-sm p-6 md:p-8">
                            <h2 class="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                                <UIcon name="i-heroicons-information-circle" class="text-primary" />
                                Tentang Agenda
                            </h2>
                            <div
                                class="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed">
                                <CoreContent :content="agenda.description" />
                            </div>
                        </div>

                        <div v-if="agenda.photos && agenda.photos.length > 0" class="space-y-4">
                            <h3 class="text-xl font-bold text-gray-900 dark:text-white">Galeri Kegiatan</h3>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <div v-for="(photo, index) in agenda.photos.slice(0, 6)" :key="index"
                                    class="relative aspect-square rounded-xl overflow-hidden group cursor-pointer shadow-sm">
                                    <NuxtImg :src="typeof photo.image === 'string' ? photo.image : ''"
                                        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        loading="lazy" />
                                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                                    </div>
                                </div>
                            </div>
                            <div class="flex justify-center mt-2">
                                <span class="text-xs text-gray-500 italic" v-if="agenda.photos.length > 6">+ {{
                                    agenda.photos.length - 6 }} foto lainnya</span>
                            </div>
                        </div>

                    </div>

                    <div class="lg:col-span-1">
                        <div class="sticky top-24 space-y-6">

                            <div
                                class="bg-white/30 dark:bg-gray-800/40 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hidden lg:block">
                                <div class="text-center mb-6">
                                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Harga Tiket</p>
                                    <div class="text-4xl font-extrabold text-primary">{{ priceLabel }}</div>
                                </div>

                                <div v-if="isRegistered"
                                    class="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-xl flex flex-col items-center gap-2 text-center border border-green-100 dark:border-green-900/50">
                                    <UIcon name="i-heroicons-check-badge-solid" class="w-10 h-10" />
                                    <div>
                                        <h4 class="font-bold">Kamu Terdaftar!</h4>
                                        <p class="text-xs opacity-80">Sebagai {{ isRegistered === 'Committee' ?
                                            'Panitia'
                                            : 'Peserta' }}</p>
                                    </div>
                                    <UButton
                                        :to="`/agendas/${id}/${isRegistered === 'Committee' ? 'committee' : 'participant'}`"
                                        variant="link" size="xs">
                                        Lihat Detail Tiket &rarr;
                                    </UButton>
                                </div>

                                <div v-else class="space-y-3">
                                    <UButton v-if="eventStatus?.label !== 'Selesai'" block size="xl" color="primary"
                                        class="font-bold rounded-xl" :disabled="!canMeRegisterAsParticipant"
                                        @click="navigateToRegisterParticipant">
                                        {{ canMeRegisterAsParticipant ? 'Daftar Sekarang' : 'Pendaftaran Tutup' }}
                                    </UButton>

                                    <div v-if="canMeRegisterAsCommittee" class="relative py-2">
                                        <div class="absolute inset-0 flex items-center" aria-hidden="true">
                                            <div class="w-full border-t border-gray-300 dark:border-gray-700"></div>
                                        </div>
                                        <div class="relative flex justify-center">
                                            <span
                                                class="bg-white dark:bg-gray-800 px-2 text-xs text-gray-500">Atau</span>
                                        </div>
                                    </div>

                                    <UButton v-if="canMeRegisterAsCommittee" block size="lg" variant="outline"
                                        color="primary" icon="i-heroicons-user-group"
                                        @click="navigateToRegisterCommittee">
                                        Daftar Panitia
                                    </UButton>

                                    <UButton v-if="eventStatus?.label === 'Selesai' && !canMeRegisterAsCommittee" block
                                        disabled color="neutral" variant="soft">Acara Selesai</UButton>
                                </div>

                                <USeparator class="my-6" />

                                <div class="space-y-3">
                                    <UButton v-if="mapsLink" :to="mapsLink" target="_blank" block variant="outline"
                                        color="neutral" icon="i-heroicons-map">
                                        Lihat di Google Maps
                                    </UButton>
                                    <UButton @click="shareAgenda" block variant="ghost" color="neutral"
                                        icon="i-heroicons-share">
                                        Bagikan Acara
                                    </UButton>
                                </div>
                            </div>

                            <div class="bg-white/30 dark:bg-gray-800/40 rounded-2xl shadow-sm p-4">
                                <div v-if="isOrganizer || isCommittee" class="flex flex-col gap-2">
                                    <h4 class="text-xs font-bold uppercase text-gray-400 mb-1 tracking-wider">Admin
                                        Tools
                                    </h4>
                                    <UButton :to="`/administrator/agendas/${id}/edit`" color="primary" variant="soft"
                                        icon="i-heroicons-pencil-square" size="sm">
                                        Edit Agenda
                                    </UButton>
                                    <UButton :to="`/administrator/agendas/${id}/participant`" color="primary"
                                        variant="soft" icon="i-heroicons-users" size="sm">
                                        Data Peserta
                                    </UButton>
                                </div>
                                <div v-else class="flex items-center gap-3">
                                    <div
                                        class="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary font-bold">
                                        H
                                    </div>
                                    <div>
                                        <p class="text-xs text-gray-500">Diselenggarakan oleh</p>
                                        <p class="font-bold text-gray-800 dark:text-white">Himatika Organizer</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>

            <div
                class="fixed bottom-0 left-0 right-0 p-4 bg-white/30 dark:bg-gray-900 border-t dark:border-gray-800 z-50 lg:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div class="flex items-center gap-4">
                    <div class="flex-1">
                        <p class="text-xs text-gray-500">Total Biaya</p>
                        <p class="text-xl font-bold text-primary">{{ priceLabel }}</p>
                    </div>

                    <div v-if="isRegistered" class="flex-1">
                        <UButton :to="`/agendas/${id}/${isRegistered === 'Committee' ? 'committee' : 'participant'}`"
                            block color="success" variant="soft" icon="i-heroicons-ticket">
                            Tiket Saya
                        </UButton>
                    </div>
                    <template v-else>
                        <div class="flex-1" v-if="!canMeRegisterAsCommittee">
                            <p class="text-xs text-gray-500">Biaya</p>
                            <p class="text-lg font-bold text-primary">{{ priceLabel }}</p>
                        </div>

                        <div v-if="canMeRegisterAsCommittee" class="flex gap-2 w-full">
                            <UButton class="flex-1" color="primary" variant="soft" @click="navigateToRegisterCommittee">
                                Jadi Panitia
                            </UButton>
                            <UButton class="flex-1" :disabled="!canMeRegisterAsParticipant"
                                @click="navigateToRegisterParticipant">
                                Daftar Peserta
                            </UButton>
                        </div>

                        <div v-else class="flex-1 text-right">
                            <UButton block size="lg" :disabled="!canMeRegisterAsParticipant"
                                @click="navigateToRegisterParticipant">
                                {{ canMeRegisterAsParticipant ? 'Daftar' : 'Tutup' }}
                            </UButton>
                        </div>
                    </template>
                </div>
            </div>

        </div>

        <div v-else class="flex flex-col h-screen items-center justify-center">
            <h1 class="text-4xl font-bold text-gray-400">404</h1>
            <p class="text-gray-500 mt-2">Agenda tidak ditemukan</p>
            <UButton to="/agendas" variant="link" class="mt-4">Kembali ke List Agenda</UButton>
        </div>
    </div>
</template>

<style scoped>
/* Custom Scrollbar for hidden horizontal scrolls if added later */
.hide-scrollbar::-webkit-scrollbar {
    display: none;
}

.hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>