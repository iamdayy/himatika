<template>
    <div class="items-center justify-center mb-2">
        <UBreadcrumb :items="links" />
        <UCard class="px-4 py-8 mt-2 md:px-8 md:py-12">
            <template #header>
                <h1 class="text-2xl font-bold text-gray-600 dark:text-white md:text-3xl">{{ $ts('news') }}</h1>
                <div class="my-4">
                    <UInput v-model="searchQuery" icon="i-heroicons-magnifying-glass" :size="responsiveUISizes.input"
                        :placeholder="$ts('search')" class="mb-4 sm:mb-0 sm:w-64" />
                    <div class="flex flex-col gap-2 mt-4 md:items-center md:justify-between md:flex-row">
                        <div class="flex flex-row gap-2">
                            <USelect v-model="sort" :items="sortOptions" label="sort" :placeholder="$ts('search')" />
                            <UButton :size="responsiveUISizes.button" variant="ghost"
                                :icon="order == 'asc' ? 'i-heroicons-arrow-up' : order == 'desc' ? 'i-heroicons-arrow-down' : 'i-heroicons-arrows-up-down'"
                                @click="order = order == '' ? 'asc' : order == 'asc' ? 'desc' : ''" />
                        </div>
                        <div class="flex flex-col gap-2 md:flex-row">
                            <USelectMenu v-model="selectedTags" :size="responsiveUISizes.select" :items="tags" multiple
                                :placeholder="$ts('filter_by', { key: 'tags' })" class="w-full md:w-48" />
                            <USelectMenu v-model="selectedCategory" :size="responsiveUISizes.select"
                                :items="categoryOptions" option-attribute="title" by="title"
                                :placeholder="$ts('filter_by', { key: 'category' })" multiple class="w-full md:w-48" />
                            <UButton color="primary" variant="ghost" icon="i-heroicons-arrow-path" @click="refresh()">
                            </UButton>
                        </div>
                    </div>

                </div>
            </template>
            <!-- Search and Filter Section -->
            <div v-if="pending">
                <USkeleton v-for="i in 10" :key="i" class="h-48" />
            </div>
            <div v-else-if="(data?.data?.news as INews[])?.length > 0">
                <!-- Hero Section -->
                <UCard v-if="mainArticle" :ui="{ root: 'overflow-hidden', body: 'p-0 sm:p-0 px-0 md:px-0' }"
                    class="mb-6">
                    <div class="relative h-[30rem]">
                        <NuxtImg provider="localProvider" :src="(mainArticle.mainImage as string)"
                            :alt="mainArticle.title" class="absolute inset-0 object-cover w-full h-full"
                            loading="lazy" />
                        <div
                            class="absolute inset-0 bg-gradient-to-t from-gray-300 dark:from-gray-600 to-transparent to-70%">
                        </div>
                        <div class="absolute bottom-0 left-0 w-full p-6">
                            <UBadge class="mb-2">{{ (mainArticle.category as ICategory).title }}</UBadge>
                            <h1 class="mb-2 text-3xl font-bold text-gray-600 dark:text-gray-200">{{
                                mainArticle.title }}</h1>
                            <div class="flex items-center gap-2 px-2 md:px-4">
                                <span class="font-semibold text-gray-600 dark:text-gray-300">{{ $ts('by') }}</span>
                                <UAvatarGroup size="2xs" :max="3">
                                    <UAvatar v-for="member in mainArticle.authors" :key="(member as IMember).NIM"
                                        :src="(member as IMember).avatar" :alt="(member as IMember).fullName" />
                                </UAvatarGroup>
                            </div>
                            <div class="w-full text-gray-400 dark:text-gray-300 line-clamp-2">
                                <CoreContent :content="mainArticle?.body!" :size="responsiveUISizes.prose" />
                            </div>
                            <div class="flex flex-wrap items-center justify-between">
                                <div class="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <div class="flex items-center flex-1 gap-2">
                                        <UBadge v-for="tag, i in mainArticle.tags?.slice(0, 5)" :key="i"
                                            color="neutral">
                                            {{ tag }}
                                        </UBadge>
                                    </div>
                                    <span class="mx-2">•</span>
                                    <div class="flex items-center gap-2">
                                        <p>{{ mainArticle.likes?.length }}</p>
                                        <UButton
                                            :icon="mainArticle.likes?.find(like => like.ip === ip) ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
                                            variant="link" size="lg"
                                            :color="mainArticle.likes?.find(like => like.ip === ip) ? 'error' : 'neutral'"
                                            @click="submitLike(mainArticle._id as string)" />
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <p>{{ mainArticle.comments?.length }}</p>
                                        <UIcon name="i-heroicons-chat-bubble-left-ellipsis" />
                                    </div>
                                    <span class="mx-2">•</span>
                                    <ClientOnly>
                                        <span>{{ calculateReadingTime(mainArticle.body) }} {{ $ts('min_read') }}</span>
                                    </ClientOnly>
                                </div>
                                <UButton color="neutral" variant="subtle" :to="`/news/${mainArticle.slug}`">
                                    {{ $ts('read_more') }}
                                </UButton>
                            </div>
                        </div>
                    </div>
                </UCard>

                <!-- News Grid -->
                <div class="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
                    <UCard v-for="news in (data?.data?.news as INews[])" :key="news.slug"
                        :ui="{ root: 'overflow-hidden', body: 'p-0 sm:p-0 px-0 md:px-0' }">
                        <div class="relative h-48">
                            <img :src="(news.mainImage as string)" :alt="news.title"
                                class="absolute inset-0 object-cover w-full h-full" />
                            <UBadge class="absolute top-2 left-2">{{
                                (news.category as ICategory).title }}</UBadge>
                        </div>
                        <div class="min-h-[6rem] space-y-2 px-2 py-1">
                            <NuxtLink :to="`/news/${news.slug}`" class="mb-2 text-lg font-semibold">{{ news.title }}
                            </NuxtLink>
                            <div class="flex items-center gap-2 px-2 md:px-4">
                                <span class="text-xs text-gray-700 dark:text-gray-300">{{ $ts('by') }}</span>
                                <UAvatarGroup size="3xs" :max="3">
                                    <UAvatar v-for="member in news.authors" :key="(member as IMember).NIM"
                                        :src="(member as IMember).avatar" :alt="(member as IMember).fullName"
                                        size="xs" />
                                </UAvatarGroup>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="flex flex-wrap w-full gap-2">
                                    <UBadge v-for="tag in news.tags?.slice(0, 5)" :key="tag" :label="tag"
                                        color="neutral" variant="soft" size="xs" />
                                </div>
                                <div class="flex items-center gap-2">
                                    <p>{{ news.likes?.length }}</p>
                                    <UButton
                                        :icon="news.likes?.find(like => like.ip === ip) ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
                                        variant="link" size="lg"
                                        :color="news.likes?.find(like => like.ip === ip) ? 'error' : 'neutral'"
                                        @click="submitLike(news._id as string)" />
                                </div>
                                <div class="flex items-center gap-2">
                                    <p>{{ news.comments?.length }}</p>
                                    <UIcon name="i-heroicons-chat-bubble-left-ellipsis" />
                                </div>
                            </div>
                        </div>
                        <template #footer>
                            <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-300">
                                <div>
                                    <h1 class="font-medium">
                                        {{ $ts('published_at') }}: </h1>
                                    <h1 class="font-light">
                                        {{
                                            news.published ?
                                                new Date(news.publishedAt!).toLocaleDateString('id-ID', {
                                                    dateStyle: 'long'
                                                }) :
                                                'not published'
                                        }}</h1>
                                </div>
                                <ClientOnly>
                                    <h2>{{ calculateReadingTime(news.body) }} {{ $ts('min_read') }}</h2>
                                </ClientOnly>
                            </div>
                        </template>
                    </UCard>
                </div>
            </div>
            <div v-else class="flex items-center justify-center">
                <div class="flex flex-col items-center justify-center gap-4">
                    <UIcon name="i-heroicons-circle-stack" class="w-12 h-12 text-gray-400" />
                    <h1 class="text-2xl font-semibold text-gray-600 dark:text-gray-400">No news found</h1>
                </div>
            </div>
            <template #footer>
                <div :class="['flex flex-wrap justify-between', responsiveClasses.pagination]">
                    <div class="flex items-center gap-1.5 mb-2 sm:mb-0">
                        <span class="text-sm leading-5">Rows per page:</span>
                        <USelect v-model="perPage" :items="pageCountOptions" class="w-20 me-2" size="xs" />
                    </div>
                    <div class="mb-2 sm:mb-0">
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
    </div>
</template>

<script setup lang="ts">
import type { ICategory, IMember, INews } from "~~/types";
import type { ICategoriesResponse, INewsResponse, IResponse, ITagsResponse } from "~~/types/IResponse";
definePageMeta({
    layout: 'client',
    auth: false,
});
useHead({
    title: 'News',
    meta: [
        { name: 'description', content: 'News' },
    ],
});


const { width } = useWindowSize()

const isMobile = computed(() => width.value < 768)

const searchQuery = ref('')
const selectedCategory = ref([])
const selectedTags = ref([]);
const sort = ref('publishedAt');
const order = ref('');
const { $api } = useNuxtApp();
const { $ts } = useI18n();
const toast = useToast();

const { data: dataTags } = useAsyncData('tags', () => $fetch<ITagsResponse>('/api/news/tags'));
const tags = computed(() => {
    return (dataTags.value?.data?.tags)
})

const { data: categoryOptions, refresh: refreshCategory } = useAsyncData('categories', () => $fetch<ICategoriesResponse>('/api/category'), {
    transform: (data) => {
        const categories = data.data?.categories || [];
        return categories.map((category) => ({
            title: category.title,
            description: category.description,
            value: category._id as string
        }))
    },
    default: () => []
});
const ip = await $fetch('/api/ip');


const sortOptions = [
    { label: $ts('date'), value: 'publishedAt' },
    { label: $ts('title'), value: 'title' },
]


const page = ref(1);
const perPage = ref(10);

const { data, refresh, pending } = useAsyncData('news', () => $fetch<INewsResponse>('/api/news', {
    query: {
        category: JSON.stringify(selectedCategory.value),
        tags: JSON.stringify(selectedTags.value),
        search: searchQuery.value,
        page: page.value,
        perPage: perPage.value,
        sort: sort.value,
        order: order.value
    }
}), {
    watch: [selectedCategory, selectedTags, searchQuery, page, perPage, sort, order],
    default: () => ({
        data: {
            news: [],
            length: 0
        }
    })
})

// Fungsi untuk menghapus tag HTML
const stripHtml = (html: string): string => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
};

// Fungsi untuk menghitung waktu baca
const calculateReadingTime = (content: string): number => {
    const wordsPerMinute = 200;
    const text = stripHtml(content);
    const wordCount = text.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
};

// Modifikasi computed property untuk mainArticle
const mainArticle = computed(() => {
    if (data.value?.data?.news) {
        return (data.value?.data?.news as INews[])[0]
    }
    return null
});


/**
 * Computed properties for pagination
 */
const pageTotal = computed(() => data.value.data?.length || 0)
const pageFrom = computed(() => (page.value - 1) * perPage.value + 1)
const pageTo = computed(() => Math.min(page.value * perPage.value, pageTotal.value || 0))
const pageCountOptions = computed(() => [10, 20, 50, 100, 200, pageTotal.value || 0]);

const submitLike = async (id: string) => {
    try {
        const response = await $api<IResponse>(`/api/news/${id}/likes`, {
            method: 'POST',
        });
        if (response.statusCode) {
            toast.add({ title: 'Success', description: response.statusMessage });
            refresh();
        }
        // if (isSubmitting.value) return;
    } catch (error: any) {
        toast.add({ title: 'Error', description: error.statusMessage, color: 'error' });
    }
}

/**
 * Computed property for responsive class names
 */
const responsiveClasses = computed(() => ({
    container: isMobile.value ? 'px-2' : 'px-6',
    title: isMobile.value ? 'text-2xl' : 'text-4xl',
    button: isMobile.value ? 'text-sm' : 'text-base',
    pagination: isMobile.value ? 'flex-col items-start' : 'flex-row items-center',
}));
const responsiveUISizes = computed<{ [key: string]: 'xs' | 'md' }>(() => ({
    button: isMobile.value ? 'xs' : 'md',
    select: isMobile.value ? 'xs' : 'md',
    input: isMobile.value ? 'xs' : 'md',
    prose: isMobile.value ? 'xs' : 'md',
}));
const links = computed(() => [{
    label: $ts('home'),
    icon: 'i-heroicons-home',
    to: '/'
}, {
    label: $ts('news'),
    icon: 'i-heroicons-clipboard-document-list',
}]);
</script>