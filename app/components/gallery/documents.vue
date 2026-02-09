<script setup lang='ts'>
import type { IDoc, IDocGrouped, IMember } from '~~/types';
import type { IDocResponse, ITagsResponse } from '~~/types/IResponse';

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
const page = ref(1);
const perPage = ref(9);

const { data: dataTags } = useAsyncData('tags', () => $api<ITagsResponse>('/api/doc/tags'));
const { data, error, pending, refresh } = useLazyAsyncData('docs', () => $api<IDocResponse>('/api/doc',
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
        default: () => ({ data: { data: [] as IDocGrouped[], length: 0 } })
    });

const perPageOptions = computed(() => {
    const length = data.value.data?.length || 0
    return [length, 10, 20, 50, 100].map((value) => ({ label: value.toString(), value }));
});
const pageTotal = computed(() => data.value.data?.length) // This value should be dynamic coming from the API
const pageFrom = computed(() => (page.value - 1) * perPage.value + 1)
const pageTo = computed(() => Math.min(page.value * perPage.value, pageTotal.value || 0))

const download = (doc: IDoc) => {
    const link = document.createElement('a');
    if (typeof doc.doc === 'string') {
        link.href = doc.doc;
        link.download = doc.label;
    } else {
        console.error('Document URL is not a string');
        return;
    }
    document.body.appendChild(link);
    link.click();
};

const editOptions = (doc: IDoc) => [
    [
        { icon: 'i-lucide-download', label: 'Download', click: () => download(doc) }
    ]
];
</script>
<template>
    <UCard class="mt-2">
        <template #header>
            <h1 class="text-lg font-semibold text-gray-600 md:text-2xl md:font-bold dark:text-gray-200">
                {{ 'Dokumen' }}
            </h1>
            <p>{{ 'Gallery Document Description' }}</p>
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
            <div v-for="(cat, i) in data.data?.data" :key="i" class="mb-4">
                <NuxtLink :to="`/${cat.type}s/${cat._id}`">
                    <div
                        class="flex items-center justify-between p-2 border-b rounded-sm dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 hover:bg-opacity-25">
                        <h3 class="text-lg font-bold md:text-xl dark:text-gray-200">{{ cat.title }}</h3>
                        <UBadge variant="outline">{{ cat.type }}</UBadge>
                    </div>
                </NuxtLink>
                <div v-for="(doc, index) in cat.docs" :key="index" class="my-2">
                    <div class="pb-2">
                        <div class="flex items-center justify-between w-full gap-4 p-4">
                            <div class="text-lg font-medium md:text-xl">{{ doc.label }}</div>
                            <div class="flex items-center mt-1">
                                <UIcon name="i-heroicons-map-pin" class="mr-1" />
                                <span class="text-sm text-gray-500">{{ (doc.uploader as IMember).fullName }}</span>
                            </div>
                            <div class="flex justify-end flex-1 gap-2 mt-2">
                                <UBadge v-for="(tag, tIndex) in doc.tags.splice(0, 4)" :key="tIndex" size="sm"
                                    color="secondary">{{ tag }}
                                </UBadge>
                                <UDropdownMenu :items="editOptions(doc)">
                                    <UButton color="neutral" variant="link" icon="i-heroicons-ellipsis-vertical" />
                                </UDropdownMenu>
                            </div>
                        </div>
                    </div>
                    <hr class="h-px mt-4 bg-gray-200 border-0 dark:bg-gray-700">
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