<script setup lang='ts'>
import { ModalsConfirmation, ModalsNewsAdd, ModalsNewsEdit } from '#components';
import type { ICategory, IMember, INews } from '~~/types';
import type { ICategoriesResponse, INewsResponse, IResponse, ITagsResponse } from '~~/types/IResponse';

/**
 * Page metadata configuration
 */
definePageMeta({
    layout: 'dashboard',
    middleware: 'sidebase-auth'
});

const ip = await $fetch('/api/ip');
const { $api } = useNuxtApp();
const overlay = useOverlay();
const toast = useToast();
const { isOrganizer } = useOrganizer();
const { $ts } = useI18n();

const AddNewsModal = overlay.create(ModalsNewsAdd);
const EditNewsModal = overlay.create(ModalsNewsEdit);
const ConfirmationModal = overlay.create(ModalsConfirmation);

const { data: tagsData } = useLazyAsyncData(() => $api<ITagsResponse>('/api/news/tags'));
const { data: categoryOptions, refresh: refreshCategory } = useLazyAsyncData(() => $api<ICategoriesResponse>('/api/category'), {
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

const tags = computed(() => tagsData.value?.data?.tags || []);

/**
 * Pagination and sorting state
 */
const sort = ref({ column: 'createdAt', direction: 'asc' as const });
const pagination = ref({ pageIndex: 1, pageSize: 10 });
const searchQuery = ref('');
const selectedTags = ref([]);
const selectedCategory = ref([]);
const notPublished = ref(true);
const archived = ref(true);
/**
 * Fetch newss data
 */
const { data, refresh, pending } = useLazyAsyncData('news',() => $api<INewsResponse>('/api/news', {
    query: {
        page: pagination.value.pageIndex,
        perPage: pagination.value.pageSize,
        sort: sort.value,
        search: searchQuery.value,
        tags: JSON.stringify(selectedTags.value),
        category: JSON.stringify(selectedCategory.value),
        notPublished: notPublished.value,
        archived: archived.value
    }
}), {
    default: () => ({
        data: {
            news: [],
            length: 0
        }
    }),
    watch: [() => pagination.value.pageIndex, () => pagination.value.pageSize, sort, searchQuery, selectedTags, selectedCategory, notPublished, archived]
});

/**
 * Computed properties for pagination
 */
const pageTotal = computed(() => data.value.data?.length || 0)
const pageFrom = computed(() => (pagination.value.pageIndex - 1) * pagination.value.pageSize + 1)
const pageTo = computed(() => Math.min(pagination.value.pageIndex * pagination.value.pageSize, pageTotal.value || 0))
const perPageOptions = computed(() => [10, 20, 50, 100, 200, pageTotal.value || 0]);

/**
 * Publish a news
 * @param {string} slug - The slug of the news to publish
 */
const publishNews = async (slug: string) => {
    try {
        const published = await $api('/api/news/publish', {
            query: { slug }
        });
        toast.add({ title: $ts('success'), description: $ts('success_to_publish_news') });
        refresh();
    } catch (error) {
        toast.add({ title: $ts('error'), description: $ts('failed_to_publish_news'), color: 'error' });
    }
}
/**
 * Archive a news
 * @param {string} slug - The slug of the news to archive
 */
const ArchiveNews = async (slug: string) => {
    try {
        const published = await $api('/api/news/archive', {
            query: { slug }
        });
        toast.add({ title: $ts('success'), description: $ts('success_to_archive_news') });
        refresh();
    } catch (error: any) {
        toast.add({ title: $ts('error'), description: $ts('failed_to_archive_news'), color: 'error' });
    }
}

/**
 * Open modal to add a new news
 */
const AddModal = () => {
    AddNewsModal.open({
        fullscreen: true,
        onTriggerRefresh() {
            refresh();
            AddNewsModal.close();
        }
    })
}

/**
 * Open modal to edit an existing news
 * @param {INews} news - The news to edit
 */
const EditModal = (news: INews) => {
    EditNewsModal.open({
        fullscreen: true,
        onTriggerRefresh() {
            refresh();
            EditNewsModal.close();
        },
        data: news
    })
}

/**
 * Open confirmation modal to delete a news
 * @param {string} slug - The slug of the news to delete
 */
const DeleteModal = (slug: string) => {
    ConfirmationModal.open({
        async onConfirm() {
            try {
                const deleted = await $api('/api/news', {
                    method: 'DELETE',
                    query: { slug }
                });
                toast.add({ title: $ts('success'), description: $ts('success_to_delete_news') });
                refresh();
                ConfirmationModal.close();
            } catch (error) {
                toast.add({ title: $ts('error'), description: $ts('failed_to_delete_news'), color: 'error' });
            }
        },
        title: $ts('delete_news'),
        body: $ts('delete_news_confirmation')
    })
}

/**
 * Open confirmation modal to publish a news
 * @param {string} slug - The slug of the news to publish
 */
const PublishModal = (slug: string) => {
    ConfirmationModal.open({
        async onConfirm() {
            await publishNews(slug);
            ConfirmationModal.close();
        },
        title: $ts('publish_news'),
        body: $ts('publish_news_confirmation')
    })
}

/**
 * Open confirmation modal to unpublish a news
 * @param {string} slug - The slug of the news to unpublish
 */
const UnpublishModal = (slug: string) => {
    ConfirmationModal.open({
        async onConfirm() {
            await publishNews(slug);
            ConfirmationModal.close();
        },
        title: $ts('unpublish_news'),
        body: $ts('unpublish_news_confirmation')
    })
}
/**
 * Open confirmation modal to archive a news
 * @param {string} slug - The slug of the news to archive
 */
const ArchiveModal = (slug: string) => {
    ConfirmationModal.open({
        async onConfirm() {
            await ArchiveNews(slug);
            ConfirmationModal.close();
        },
        title: $ts('archive_news'),
        body: $ts('archive_news_confirmation')
    })
}
/**
 * Open confirmation modal to archive a news
 * @param {string} slug - The slug of the news to archive
 */
const UnarchiveModal = (slug: string) => {
    ConfirmationModal.open({
        async onConfirm() {
            await ArchiveNews(slug);
            ConfirmationModal.close();
        },
        title: $ts('unarchive_news'),
        body: $ts('unarchive_news_confirmation')
    })
}

const submitLike = async (id: string) => {
    try {
        const response = await $api<IResponse>(`/api/news/${id}/likes`, {
            method: 'POST',
        });
        if (response.statusCode) {
            refresh();
        }
        // if (isSubmitting.value) return;
    } catch (error: any) {
    }
}

const share = async (news: INews) => {
    const url = `${window.location.origin}/news/${news.slug}`;

    navigator.share({ title: news.title, text: news.body, url });
    toast.add({ title: 'Link copied to clipboard' });
}

/**
 * Generate dropdown items for each news
 * @param {INews} news - The news to generate items for
 * @returns {Array} Array of dropdown items
 */
const items = (news: INews): Array<any> => [[
    {
        label: $ts('delete'),
        icon: 'i-heroicons-trash',
        onSelect: () => DeleteModal(news.slug!),
        disabled: !isOrganizer.value
    },
    {
        label: $ts('edit'),
        icon: 'i-heroicons-pencil-square',
        onSelect: () => EditModal(news),
        disabled: !isOrganizer.value
    },
    {
        label: $ts(news.published ? 'unpublish' : 'publish'),
        icon: news.published ? 'i-heroicons-arrow-down-on-square' : 'i-heroicons-arrow-up-on-square',
        onSelect: () => news.published ? UnpublishModal(news.slug!) : PublishModal(news.slug!),
        disabled: !isOrganizer.value
    },
    {
        label: $ts('share'),
        icon: 'i-heroicons-share',
        onSelect: () => share(news)
    },
    {
        label: $ts(news.archived ? 'unarchive' : 'archive'),
        icon: 'i-heroicons-archive-box',
        onSelect: () => news.archived ? UnarchiveModal(news.slug!) : ArchiveModal(news.slug!),
        disabled: !isOrganizer.value
    }
]]

/**
 * Responsive design
 */
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 640);

/**
 * Responsive UI sizes for components
 */
const responsiveUISizes = computed<{ [key: string]: 'xs' | 'md' }>(() => ({
    button: isMobile.value ? 'xs' : 'md',
    input: isMobile.value ? 'xs' : 'md',
}));

const links = computed(() => [{
    label: $ts('dashboard'),
    icon: 'i-heroicons-home',
    to: '/dashboard'
}, {
    label: $ts('news'),
    icon: 'i-heroicons-clipboard-document-list',

}]);

/**
 * Set page title
 */
useHead({
    title: 'News'
});
useSeoMeta({
    title: 'News',
    description: 'News page for managing news',
    keywords: 'news, manage, dashboard'
});
</script>
<template>
    <div class="items-center justify-center mb-24">
        <UCard class="p-2 mt-2 md:p-4">
            <template #header>
                <UBreadcrumb :links="links" />
                <div class="flex flex-row items-center justify-between w-full p-1 md:p-2">
                    <h1 class="text-lg font-semibold text-gray-600 md:text-2xl md:font-bold dark:text-gray-200">{{
                        $ts('news') }}
                    </h1>
                    <div class="min-w-24">
                        <UButton :label="$ts('add')" :size="responsiveUISizes.button" @click="AddModal"
                            v-if="isOrganizer" block />
                    </div>
                </div>
                <div class="flex flex-col gap-2 px-2 my-2 md:items-center md:justify-between md:flex-row md:px-4">
                    <UInput v-model="searchQuery" :size="responsiveUISizes.input" icon="i-heroicons-magnifying-glass"
                        placeholder="Search news..." class="mb-4 md:mb-0 md:w-64" />
                    <div class="flex flex-wrap justify-end gap-2 md:flex-row">
                        <USelectMenu v-if="!isMobile" v-model="selectedTags" :items="tags" multiple
                            :placeholder="$ts('filter_by', { key: $ts('tag') })" class="w-full md:min-w-48 md:max-w-24"
                            :size="responsiveUISizes.input" />
                        <USelectMenu v-if="!isMobile" v-model="selectedCategory" :items="categoryOptions"
                            :placeholder="$ts('filter_by', { key: $ts('category') })" multiple value-key="value"
                            class="w-full md:min-w-48 md:max-w-24" :size="responsiveUISizes.input" />
                        <UFormField class="flex flex-col items-center gap-2" :label="$ts('not_published')" size="xs">
                            <!-- <label class="text-xs font-light text-gray-600 dark:text-gray-400" for="published">{{
                                $ts('not_published') }}</label> -->
                            <USwitch v-model="notPublished" id="published" size="xs" />
                        </UFormField>
                        <UFormField class="flex flex-col items-center gap-2" :label="$ts('archived')" size="xs">
                            <!-- <label class="text-xs font-light text-gray-600 dark:text-gray-400" for="published">{{
                                $ts('archived') }}</label> -->
                            <USwitch v-model="archived" id="archived" size="xs" />
                        </UFormField>
                        <UButton :size="responsiveUISizes.button" color="primary" variant="ghost"
                            icon="i-heroicons-arrow-path" @click="refresh()">
                        </UButton>
                    </div>
                </div>
            </template>
            <div v-if="pending">
                <USkeleton v-for="i in 10" :key="i" class="h-48" />
            </div>
            <div v-else-if="(data.data?.news as INews[])?.length > 0"
                class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                <UCard :ui="{ root: 'overflow-hidden', body: 'p-0 sm:p-0 px-0 md:px-0' }"
                    v-for="news, i in (data.data?.news as INews[])" :key="i">
                    <div class="relative h-48">
                            <img :src="(news.mainImage as string)" :alt="news.title"
                                class="absolute inset-0 object-cover w-full h-full" />
                            <UBadge class="absolute top-2 left-2">{{
                                (news.category as ICategory).title }}</UBadge>
                        </div>
                    <div class="min-h-[6rem] space-y-2 px-4 py-1">
                        <NuxtLink :to="`/news/${news.slug}`">
                            <h2 class="text-sm font-semibold sm:text-lg md:text-xl lg:text-2xl line-clamp-2">{{
                                news.title
                            }}</h2>
                        </NuxtLink>
                        <div class="line-clamp-3">
                            <CoreContent :content="news.body" size="sm" />
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="flex flex-wrap w-full gap-2">
                                <UBadge v-for="tag in news.tags?.slice(0, 5)" :key="tag" :label="tag" color="neutral"
                                    variant="soft" size="xs" />
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
                        <div class="flex flex-row justify-between">
                            <div class="flex items-center gap-2">
                                <UAvatarGroup size="2xs" :max="3">
                                    <UAvatar v-for="member in news.authors" :key="(member as IMember).NIM"
                                        :src="(member as IMember).avatar" :alt="(member as IMember).fullName" />
                                </UAvatarGroup>
                                <div v-if="news.published && !news.archived" class="text-xs font-light">
                                    {{ $ts('published_at') }}
                                    <span>
                                        {{ new Date(news.publishedAt!).toLocaleDateString('id-Id', {
                                            dateStyle: "long"
                                        }) }}
                                    </span>
                                </div>
                                <span class="text-xs font-light text-red-500 ms-3" v-else-if="news.archived">
                                    {{ $ts('archived_at') }}
                                    <span>
                                        {{ new Date(news.archivedAt!).toLocaleDateString('id-Id', {
                                            dateStyle: "long"
                                        }) }}
                                    </span>
                                </span>
                                <span class="text-xs font-light text-red-500 ms-3" v-else>
                                    {{ $ts('not_published') }}
                                </span>
                            </div>
                            <UDropdownMenu :items="items(news)">
                                <UButton icon="i-ion-ellipsis-vertical" variant="link" color="neutral" />
                            </UDropdownMenu>
                        </div>
                    </template>
                </UCard>
            </div>
            <div v-else class="flex items-center justify-center">
                <div class="flex flex-col items-center justify-center gap-4">
                    <UIcon name="i-heroicons-circle-stack" class="w-12 h-12 text-gray-400" />
                    <h1 class="text-2xl font-semibold text-gray-600 dark:text-gray-400">{{ $ts('not_found') }}</h1>
                </div>
            </div>
            <template #footer>
                <div class="flex flex-col items-center justify-between gap-2 md:flex-row">
                    <div class="flex items-center gap-1.5 mb-2 md:mb-0">
                        <span class="text-xs leading-none md:text-sm md:leading-5">{{ $ts('rows_per_page') }}</span>
                        <USelect v-model="pagination.pageSize" :items="perPageOptions" class="w-20 me-2" size="xs" />
                    </div>
                    <div class="mb-2 md:mb-0">
                        <span class="text-xs leading-none md:text-sm md:leading-5">
                            {{ $ts('showing_results', { start: pageFrom, end: pageTo, total: pageTotal }) }}
                        </span>
                    </div>
                    <UPagination v-model:page="pagination.pageIndex" :items-per-page="pagination.pageSize"
                        :total="pageTotal" :sibling-count="isMobile ? 1 : 2" show-edges />
                </div>
            </template>
        </UCard>
    </div>
</template>
<style scoped></style>