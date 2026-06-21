<script setup lang='ts'>
import { ModalsDocAdd, ModalsImageAdd, ModalsVideoAdd } from '#components';
import type { IDoc, IPhoto, IVideo } from '~~/types';
import type { IAgendaResponse } from '~~/types/IResponse';

definePageMeta({
    layout: 'dashboard',
    middleware: ['sidebase-auth', 'organizer']
});

const route = useRoute();
const id = route.params.id as string;
const { $api, $ts } = useNuxtApp();
const toast = useToast();
const overlay = useOverlay();

const { data: agenda, pending, refresh } = useLazyAsyncData('admin-agenda-gallery',
    () => $api<IAgendaResponse>(`/api/agenda/${id}`), {
    transform: (data) => data.data?.agenda
});

const links = computed(() => [
    { label: $ts('dashboard'), to: '/dashboard', icon: 'i-heroicons-home' },
    { label: 'Agendas', to: '/administrator/agendas', icon: 'i-heroicons-calendar' },
    { label: agenda.value?.title || 'Detail', to: `/administrator/agendas/${id}`, icon: 'i-heroicons-document-text' },
    { label: 'Galeri & Dokumen', icon: 'i-heroicons-photo' }
]);

const AddPhotoModal = overlay.create(ModalsImageAdd);
const AddVideoModal = overlay.create(ModalsVideoAdd);
const AddDocModal = overlay.create(ModalsDocAdd);

const addPhoto = () => {
    AddPhotoModal.open({
        onPhoto: async (payload: { photos: IPhoto[] }) => {
            let hasError = false;
            for (const photo of payload.photos) {
                const formData = new FormData();
                if ((photo.image as any) instanceof File) {
                    formData.append('image', photo.image as Blob);
                } else if ((photo.image as any) instanceof Blob) {
                    formData.append('image', photo.image as Blob, 'image.jpg');
                } else {
                    formData.append('image', photo.image as string);
                }
                formData.append('tags', JSON.stringify(photo.tags || []));

                try {
                    await $api(`/api/agenda/${id}/photo`, {
                        method: 'POST',
                        body: formData
                    });
                } catch (e) {
                    console.error(e);
                    hasError = true;
                }
            }
            if (!hasError) {
                toast.add({ title: 'Berhasil mengunggah foto', color: 'success' });
            } else {
                toast.add({ title: 'Gagal mengunggah foto', color: 'error' });
            }
            refresh();
            AddPhotoModal.close();
        }
    });
};

const addVideo = () => {
    AddVideoModal.open({
        onVideo: async (payload: { videos: IVideo[] }) => {
            let hasError = false;
            for (const video of payload.videos) {
                const formData = new FormData();
                if ((video.video as any) instanceof File) {
                    formData.append('video', video.video as Blob);
                } else if ((video.video as any) instanceof Blob) {
                    formData.append('video', video.video as Blob, 'video.mp4');
                } else {
                    formData.append('video', video.video as string);
                }
                formData.append('tags', JSON.stringify(video.tags || []));

                try {
                    await $api(`/api/agenda/${id}/video`, {
                        method: 'POST',
                        body: formData
                    });
                } catch (e) {
                    console.error(e);
                    hasError = true;
                }
            }
            if (!hasError) {
                toast.add({ title: 'Berhasil mengunggah video', color: 'success' });
            } else {
                toast.add({ title: 'Gagal mengunggah video', color: 'error' });
            }
            refresh();
            AddVideoModal.close();
        }
    });
};

const addDoc = () => {
    AddDocModal.open({
        onDoc: async (doc: IDoc) => {
            const formData = new FormData();
            formData.append('label', doc.label as string);
            formData.append('no', doc.no as string);
            formData.append('tags', JSON.stringify(doc.tags || []));
            if ((doc.doc as any) instanceof File) {
                formData.append('doc', doc.doc as Blob);
            }

            try {
                await $api(`/api/agenda/${id}/doc`, {
                    method: 'POST',
                    body: formData
                });
                toast.add({ title: 'Berhasil mengunggah dokumen', color: 'success' });
            } catch (e) {
                console.error(e);
                toast.add({ title: 'Gagal mengunggah dokumen', color: 'error' });
            }
            refresh();
            AddDocModal.close();
        }
    });
};

const deleteMedia = async (type: string, mediaId: string) => {
    if (!confirm('Yakin ingin menghapus item ini?')) return;
    try {
        await $api(`/api/${type}`, {
            method: 'DELETE',
            query: { id: mediaId }
        });
        toast.add({ title: 'Berhasil menghapus item', color: 'success' });
        refresh();
    } catch (e) {
        console.error(e);
        toast.add({ title: 'Gagal menghapus item', color: 'error' });
    }
};

const tabs = [
    { label: 'Foto', icon: 'i-heroicons-photo', slot: 'photos' },
    { label: 'Video', icon: 'i-heroicons-video-camera', slot: 'videos' },
    { label: 'Dokumen', icon: 'i-heroicons-document', slot: 'docs' }
];

</script>

<template>
    <div class="space-y-6 mb-24">
        <UBreadcrumb :items="links" />

        <div v-if="pending" class="flex justify-center py-10">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-primary" />
        </div>

        <div v-else-if="agenda" class="space-y-6">
            <div
                class="bg-white/30 dark:bg-gray-800/40 p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between md:items-center gap-4 rounded-2xl">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Galeri & Dokumen: {{ agenda.title }}
                    </h1>
                </div>
            </div>

            <UTabs :items="tabs" class="w-full">
                <template #photos>
                    <UCard>
                        <template #header>
                            <div class="flex justify-between items-center">
                                <h3 class="font-semibold flex items-center gap-2 text-lg">
                                    <UIcon name="i-heroicons-photo" /> Kumpulan Foto
                                </h3>
                                <UButton size="sm" icon="i-heroicons-plus" color="primary" @click="addPhoto">Tambah Foto
                                </UButton>
                            </div>
                        </template>
                        <div v-if="!agenda.photos || agenda.photos.length === 0" class="text-center py-8 text-gray-500">
                            Belum ada foto yang diunggah.
                        </div>
                        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            <div v-for="(photo, i) in agenda.photos" :key="i"
                                class="relative group aspect-square rounded-lg overflow-hidden border dark:border-gray-700">
                                <NuxtImg provider="localProvider" :src="(photo.image as string)"
                                    class="object-cover w-full h-full transition-transform group-hover:scale-105"
                                    loading="lazy" />
                                <div
                                    class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <UButton icon="i-heroicons-trash" color="error" size="xs" variant="solid"
                                        @click="deleteMedia('photo', photo._id as string)" />
                                </div>
                            </div>
                        </div>
                    </UCard>
                </template>
                <template #videos>
                    <UCard>
                        <template #header>
                            <div class="flex justify-between items-center">
                                <h3 class="font-semibold flex items-center gap-2 text-lg">
                                    <UIcon name="i-heroicons-video-camera" /> Kumpulan Video
                                </h3>
                                <UButton size="sm" icon="i-heroicons-plus" color="primary" @click="addVideo">Tambah
                                    Video</UButton>
                            </div>
                        </template>
                        <div v-if="!agenda.videos || agenda.videos.length === 0" class="text-center py-8 text-gray-500">
                            Belum ada video yang diunggah.
                        </div>
                        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div v-for="(video, i) in agenda.videos" :key="i"
                                class="relative group rounded-lg overflow-hidden border dark:border-gray-700 bg-black">
                                <video controls class="w-full h-full">
                                    <source :src="(video.video as string)" type="video/mp4" />
                                </video>
                                <div
                                    class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <UButton icon="i-heroicons-trash" color="error" size="xs" variant="solid"
                                        @click="deleteMedia('video', video._id as string)" />
                                </div>
                            </div>
                        </div>
                    </UCard>
                </template>
                <template #docs>
                    <UCard>
                        <template #header>
                            <div class="flex justify-between items-center">
                                <h3 class="font-semibold flex items-center gap-2 text-lg">
                                    <UIcon name="i-heroicons-document" /> Kumpulan Dokumen
                                </h3>
                                <UButton size="sm" icon="i-heroicons-plus" color="primary" @click="addDoc">Tambah
                                    Dokumen</UButton>
                            </div>
                        </template>
                        <div v-if="!agenda.docs || agenda.docs.length === 0" class="text-center py-8 text-gray-500">
                            Belum ada dokumen yang diunggah.
                        </div>
                        <div v-else class="space-y-4">
                            <div v-for="(doc, i) in agenda.docs" :key="i"
                                class="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg">
                                <div>
                                    <h4 class="font-medium text-lg">{{ doc.label }}</h4>
                                    <p class="text-sm text-gray-500">No: {{ doc.no }}</p>
                                    <div class="mt-2 flex gap-1">
                                        <UBadge v-for="tag in doc.tags" :key="tag" size="xs" variant="soft">{{ tag }}
                                        </UBadge>
                                    </div>
                                </div>
                                <div class="flex gap-2">
                                    <UButton icon="i-heroicons-arrow-down-tray" color="neutral" variant="ghost"
                                        :to="(doc.doc as string)" target="_blank" />
                                    <UButton icon="i-heroicons-trash" color="error" variant="ghost"
                                        @click="deleteMedia('doc', doc._id as string)" />
                                </div>
                            </div>
                        </div>
                    </UCard>
                </template>
            </UTabs>
        </div>
    </div>
</template>
