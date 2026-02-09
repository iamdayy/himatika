<script setup lang="ts">
import { GalleryDocuments, GalleryPhotos, GalleryVideos } from '#components';
definePageMeta({
    layout: 'client',
    auth: false
});
useHead({
    title: 'Galeri',
});

const links = computed(() => [{
    label: 'Beranda',
    icon: 'i-heroicons-home',
    to: '/'
}, {
    label: 'Galeri',
    icon: 'i-heroicons-photo',
}]);
const items = [
    {
        label: 'Foto',
        icon: 'i-heroicons-photo',
        key: 'photos',
        description: 'This is the photos grouped by agenda/project',
    },
    {
        label: 'Video',
        icon: 'i-heroicons-information-circle',
        key: 'videos',
        description: 'This is the videos grouped by agenda/project',
    },
    {
        label: 'Dokumen',
        icon: 'i-heroicons-information-circle',
        key: 'documents',
        description: 'This is the documents grouped by agenda/project',
    }
]
</script>


<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :links="links" />
        <UTabs :items="items" class="px-4 mt-2 md:px-8">
            <template #content="{ item }">
                <div v-if="item.key === 'photos'">
                    <GalleryPhotos />
                </div>
                <div v-if="item.key === 'videos'">
                    <GalleryVideos />
                </div>
                <div v-if="item.key === 'documents'">
                    <GalleryDocuments />
                </div>
            </template>
        </UTabs>
    </div>
</template>