<script setup lang='ts'>
import type { IVideoGrouped } from '~/types';
import type { ITagsResponse, IVideoResponse } from '~/types/IResponse';

const { width } = useWindowSize();

const isMobile = computed(() => width.value < 768);

const responsiveUISizes = computed<{ [key: string]: 'sm' | 'md' }>(() => ({
    input: isMobile.value ? 'sm' : 'md',
    button: isMobile.value ? 'sm' : 'md',
    select: isMobile.value ? 'sm' : 'md',
}));

const searchQuery = ref('');
const selectedTags = ref([]);
const sort = ref('');
const order = ref('');

const { $api } = useNuxtApp();
const { $ts } = useI18n();


const page = ref(1);
const perPage = ref(9);

const { data: dataTags } = useAsyncData('tags', () => $api<ITagsResponse>('/api/photo/tags'));
const { data, error, pending, refresh } = useLazyAsyncData('videos', () => $api<IVideoResponse>('/api/video',
    {
        query: {
            page: page.value,
            perPage: perPage.value,
            tags: JSON.stringify(selectedTags.value),
            search: searchQuery.value,
            sort: sort.value,
            order: order.value,
        }
    }),



    {
        watch: [page, perPage, selectedTags, searchQuery, order, sort],
        default: () => ({ data: { data: [] as IVideoGrouped[], length: 0 } })
    });

const perPageOptions = computed(() => {
    const length = data.value.data?.length || 0
    return [length, 10, 20, 50, 100].map((value) => ({ label: value.toString(), value }));
});
const pageTotal = computed(() => data.value.data?.length) // This value should be dynamic coming from the API
const pageFrom = computed(() => (page.value - 1) * perPage.value + 1)
const pageTo = computed(() => Math.min(page.value * perPage.value, pageTotal.value || 0))


const tags = computed(() => {
    return dataTags.value?.data?.tags || [];
});

const getImageClasses = (index: number, groupSize: number) => {
    const baseClasses = 'transform'
    const rotationClasses = ['-rotate-6', 'rotate-0', 'rotate-6']
    return `${baseClasses} ${rotationClasses[index % 3]}`
}

const getImageStyles = (index: number, groupSize: number) => {
    const baseZIndex = 10
    const zIndex = baseZIndex + index
    const top = `${index * 8}px`
    const left = `${index * 8}px`
    return {
        zIndex: zIndex,
        top: top,
        left: left,
    }
}
async function createThumbnail(vidUrl: string): Promise<string> {
    try {
        const video = document.createElement('video');
        video.src = vidUrl;
        await new Promise<void>((resolve, reject) => {
            video.addEventListener('loadeddata', () => resolve());
            video.addEventListener('error', reject);
        });

        const offscreenCanvas = new OffscreenCanvas(video.videoWidth, video.videoHeight);
        const ctx = offscreenCanvas.getContext('2d');

        if (!ctx) {
            throw new Error('Could not get 2D context for OffscreenCanvas');
        }

        video.currentTime = 5; // Atur waktu video (dalam detik)
        ctx.drawImage(video, 0, 0);

        const thumbnailBlob = await offscreenCanvas.convertToBlob({ type: 'image/png' });
        return URL.createObjectURL(thumbnailBlob);
    } catch (error) {
        console.error('Error creating thumbnail:', error);
        throw error; // Tangani error sesuai kebutuhan Anda
    }
}
const videos = ref<IVideoGrouped[]>([]); // Inisialisasi sebagai array kosong

watch(
    () => data.value.data?.data, // Watch perubahan pada data video
    async (newData) => {
        if (newData) {
            const videoGroups = await Promise.all(newData.map(async (cat) => {
                const videosWithThumbnails = await Promise.all(cat.videos.map(async (video) => {
                    try {
                        return {
                            ...video,
                            thumbnail: await createThumbnail(video.video as string),
                        };
                    } catch (error) {
                        console.error(`Error creating thumbnail for video ${video._id}:`, error);
                        return {
                            ...video,
                            thumbnail: undefined, // Atau null jika tidak ada default
                        };
                    }
                }));
                return {
                    ...cat,
                    videos: videosWithThumbnails,
                };
            }));
            videos.value = videoGroups;
        }
    },
    { deep: true, immediate: true } // Pantau perubahan secara mendalam dan jalankan segera
);
</script>
<template>
    <UCard class="mt-2">
        <template #header>
            <h1 class="text-lg font-semibold text-gray-600 md:text-2xl md:font-bold dark:text-gray-200">{{ $ts('video')
            }}
            </h1>
            <p>{{ $ts('gallery_video_description') }}</p>
        </template>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-4" v-if="pending">
            <div v-for="i in 4" :key="i" class="grid gap-4">
                <div v-for="j in 2" :key="j" :style="{ height: `${Math.floor((Math.random() + 1) * 400)}px` }">
                    <USkeleton class="min-w-full min-h-full rounded-lg" />
                </div>
            </div>
        </div>
        <div v-else-if="!data" class="flex items-center justify-center">
            <UButton label="Refresh" @click="refresh()" color="secondary" variant="ghost" size="lg">
                <template #trailing>
                    <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 md:w-8 md:h-8" />
                </template>
            </UButton>
        </div>
        <div v-else>
            <div class="grid grid-cols-1 gap-4 p-2 md:grid-cols-3 md:p-4">
                <div v-for="(group, groupIndex) in videos" :key="groupIndex" class="group">
                    <NuxtLink :to="`/${group.type}s/${group._id}`">
                        <div
                            class="rounded-lg shadow-2xl ease-out transition-transform bg-gradient-to-b from-transparent from-60% to-primary-light dark:to-primary-dark h-full">
                            <div class="relative w-56 h-56 mx-auto mt-5 md:w-80 md:h-80">
                                <div v-for="video, i in group.videos" :key="i"
                                    class="absolute overflow-hidden transition-all duration-300 ease-in-out bg-gray-200 rounded-lg shadow-md w-44 h-44 group-hover:scale-110 md:w-72 md:h-72"
                                    :class="getImageClasses(i, group.videos.length)"
                                    :style="getImageStyles(i, group.videos.length)">
                                    <img :src="(video.thumbnail as string)" class="object-cover w-full h-full" />
                                </div>
                            </div>
                            <div class="p-4">
                                <div class="min-h-40">
                                    <h1 class="p-2 text-2xl font-semibold text-center text-gray-800 dark:text-gray-200">
                                        {{
                                            group.title }}</h1>
                                    <h1 class="p-2 text-xl font-semibold text-center text-gray-800 dark:text-gray-200">
                                        {{
                                            group.type }}</h1>

                                </div>
                                <p class="p-2 text-lg font-semibold text-gray-800 dark:text-gray-200">{{
                                    group.videos.length }} images
                                </p>
                                <div class="flex flex-wrap gap-2">
                                    <!-- <UBadge v-for="tag in group.videos.map((photo) => photo.tags).flat().slice(0, 5)"
                                        :key="tag" variant="outline">{{ tag }}
                                    </UBadge>
                                    <UBadge variant="outline"
                                        v-if="group.videos.map((photo) => photo.tags).flat().length > 5">
                                        ...
                                    </UBadge> -->
                                </div>
                            </div>
                        </div>
                    </NuxtLink>
                </div>
            </div>

        </div>
        <template #footer>
            <div class="flex flex-wrap items-center justify-between gap-1.5">
                <div class="flex items-center gap-1.5">
                    <span class="text-sm leading-5">Rows per page:</span>
                    <USelect v-model="perPage" :items="perPageOptions" :size="responsiveUISizes.select"
                        class="w-20 me-2" />
                </div>
                <div>

                    <span class="text-sm leading-5">
                        Showing
                        <span class="font-medium">{{ pageFrom }}</span>
                        to
                        <span class="font-medium">{{ pageTo }}</span>
                        of
                        <span class="font-medium">{{ pageTotal }}</span>
                        results
                    </span>
                </div>
                <div class="flex items-center gap-3">
                    <UPagination v-model:page="page" :items-per-page="perPage" :total="pageTotal"
                        :sibling-count="isMobile ? 2 : 6" />
                </div>
            </div>
        </template>
    </UCard>
</template>
<style scoped></style>