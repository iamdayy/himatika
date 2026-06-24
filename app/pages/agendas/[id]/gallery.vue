<script setup lang='ts'>
import type { ICategory } from '~~/types';
import type { IAgendaResponse } from '~~/types/IResponse';

definePageMeta({
    layout: 'client',
    auth: false
});

const route = useRoute();
const id = route.params.id as string;
const { $api, $ts } = useNuxtApp();

const { data: agenda, pending } = useLazyAsyncData(`agenda-gallery-${id}`,
    () => $api<IAgendaResponse>(`/api/agenda/${id}`), {
    transform: (data) => data.data?.agenda
});

const links = computed(() => [
    { label: $ts('home'), to: '/' },
    { label: $ts('agenda'), to: '/agendas' },
    { label: agenda.value?.title || 'Detail', to: `/agendas/${id}` },
    { label: 'Galeri & Dokumen' }
]);

const bannerImage = computed(() => {
    if (agenda.value?.photos && agenda.value.photos.length > 0) {
        const firstPhoto = agenda.value.photos[0];
        return typeof firstPhoto?.image === 'string' ? firstPhoto.image : `/img/placeholder-banner-${Math.floor(Math.random() * 3) + 1}.jpeg`;
    }
    return `/img/placeholder-banner-${Math.floor(Math.random() * 3) + 1}.jpeg`;
});

const tabs = [
    { label: 'Foto', icon: 'i-heroicons-photo', slot: 'photos' },
    { label: 'Video', icon: 'i-heroicons-video-camera', slot: 'videos' },
    { label: 'Dokumen', icon: 'i-heroicons-document', slot: 'docs' }
];

useSeoMeta({
    title: () => `Galeri ${agenda.value?.title || 'Agenda'}`,
    ogTitle: () => `Galeri ${agenda.value?.title || 'Agenda'}`,
});

</script>

<template>
    <div class="min-h-screen space-y-2 pb-24">
        <UBreadcrumb :items="links" />
        
        <div v-if="pending" class="flex justify-center py-20">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-5xl text-primary" />
        </div>

        <div v-else-if="agenda" class="space-y-8">
            <div class="relative h-[250px] md:h-[350px] w-full overflow-hidden bg-gray-900 group rounded-2xl">
                <NuxtImg :src="bannerImage" provider="localProvider"
                    class="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm scale-105 transition-transform duration-700 group-hover:scale-110"
                    alt="Banner" />
                <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>

                <div class="absolute inset-0 container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-8 z-10 text-center md:text-left">
                    <h1 class="text-3xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-lg">
                        Galeri & Dokumen
                    </h1>
                    <p class="text-lg text-gray-200 font-medium">
                        {{ agenda.title }}
                    </p>
                </div>
            </div>

            <div class="container mx-auto px-4 sm:px-6 lg:px-8">
                <UTabs :items="tabs" class="w-full">
                    <template #photos>
                        <div v-if="!agenda.photos || agenda.photos.length === 0" class="text-center py-16 text-gray-500 bg-white/50 dark:bg-gray-800/50 rounded-2xl border dark:border-gray-700">
                            <UIcon name="i-heroicons-photo" class="text-4xl mb-2 opacity-50" />
                            <p>Belum ada foto yang dibagikan.</p>
                        </div>
                        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
                            <div v-for="(photo, i) in agenda.photos" :key="i" class="relative group aspect-square rounded-2xl overflow-hidden shadow-md ring-1 ring-white/20 cursor-pointer bg-gray-100 dark:bg-gray-800">
                                <NuxtImg provider="localProvider" :src="(photo.image as string)" class="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                            </div>
                        </div>
                    </template>
                    <template #videos>
                        <div v-if="!agenda.videos || agenda.videos.length === 0" class="text-center py-16 text-gray-500 bg-white/50 dark:bg-gray-800/50 rounded-2xl border dark:border-gray-700">
                            <UIcon name="i-heroicons-video-camera" class="text-4xl mb-2 opacity-50" />
                            <p>Belum ada video yang dibagikan.</p>
                        </div>
                        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div v-for="(video, i) in agenda.videos" :key="i" class="relative group rounded-2xl overflow-hidden shadow-lg bg-black aspect-video border dark:border-gray-700">
                                <video controls class="w-full h-full object-contain">
                                    <source :src="(video.video as string)" type="video/mp4" />
                                </video>
                            </div>
                        </div>
                    </template>
                    <template #docs>
                        <div v-if="!agenda.docs || agenda.docs.length === 0" class="text-center py-16 text-gray-500 bg-white/50 dark:bg-gray-800/50 rounded-2xl border dark:border-gray-700">
                            <UIcon name="i-heroicons-document" class="text-4xl mb-2 opacity-50" />
                            <p>Belum ada dokumen yang dibagikan.</p>
                        </div>
                        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <UCard v-for="(doc, i) in agenda.docs" :key="i" class="hover:shadow-md transition-shadow border dark:border-gray-700">
                                <div class="flex items-start justify-between gap-4">
                                    <div class="flex items-start gap-3">
                                        <div class="bg-primary/10 p-3 rounded-lg text-primary">
                                            <UIcon name="i-heroicons-document-text" class="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 class="font-bold text-gray-900 dark:text-white line-clamp-2">{{ doc.label }}</h4>
                                            <p class="text-sm text-gray-500 mt-1">No: {{ doc.no }}</p>
                                            <div class="mt-3 flex flex-wrap gap-1">
                                                <UBadge v-for="tag in doc.tags" :key="tag" size="xs" variant="soft" color="primary">{{ tag }}</UBadge>
                                            </div>
                                        </div>
                                    </div>
                                    <UButton icon="i-heroicons-arrow-down-tray" color="primary" variant="ghost" :to="(doc.doc as string)" target="_blank" />
                                </div>
                            </UCard>
                        </div>
                    </template>
                </UTabs>
            </div>
        </div>
        <div v-else class="flex flex-col items-center justify-center py-20">
            <h1 class="text-4xl font-bold text-gray-400">404</h1>
            <p class="text-gray-500 mt-2">Agenda tidak ditemukan</p>
            <UButton to="/agendas" variant="link" class="mt-4">Kembali ke List Agenda</UButton>
        </div>
    </div>
</template>
