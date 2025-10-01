<script setup lang="ts">
import { GalleryDocuments, GalleryPhotos, GalleryVideos } from '#components';
definePageMeta({
    layout: 'client',
    auth: false
});
const { $ts } = useI18n();
useHead({
    title: $ts('gallery'),
});

const links = computed(() => [{
    label: $ts('home'),
    icon: 'i-heroicons-home',
    to: '/'
}, {
    label: $ts('gallery'),
    icon: 'i-heroicons-photo',
}]);
const items = [
    {
        label: $ts('photo'),
        icon: 'i-heroicons-photo',
        key: 'photos',
        description: 'This is the photos grouped by agenda/project',
    },
    {
        label: $ts('video'),
        icon: 'i-heroicons-information-circle',
        key: 'videos',
        description: 'This is the videos grouped by agenda/project',
    },
    {
        label: $ts('document'),
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