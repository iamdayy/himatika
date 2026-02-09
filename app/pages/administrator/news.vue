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
const organizerStore = useOrganizerStore();
const { isOrganizer } = storeToRefs(organizerStore);
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
const sort = ref({ column: 'createdAt', direction: 'desc' as const });
const pagination = ref({ pageIndex: 1, pageSize: 10 });
const searchQuery = ref('');
const selectedTags = ref([]);
const selectedCategory = ref([]);
const notPublished = ref(true);
const archived = ref(false);
/**
 * Fetch newss data
 */
const { data, refresh, pending } = useAsyncData('admin-news', () => $api<INewsResponse>('/api/admin/news', {
    query: {
        page: pagination.value.pageIndex,
        perPage: pagination.value.pageSize,
        sort: sort.value.column,
        order: sort.value.direction,
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
        toast.add({ title: 'Berhasil!', description: 'Success To Publish News' });
        refresh();
    } catch (error) {
        toast.add({ title: 'Maaf, terjadi kesalahan. Silakan coba lagi nanti.', description: 'Failed To Publish News', color: 'error' });
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
        toast.add({ title: 'Berhasil!', description: 'Success To Archive News' });
        refresh();
    } catch (error: any) {
        toast.add({ title: 'Maaf, terjadi kesalahan. Silakan coba lagi nanti.', description: 'Failed To Archive News', color: 'error' });
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
                toast.add({ title: 'Berhasil!', description: 'Success To Delete News' });
                refresh();
                ConfirmationModal.close();
            } catch (error) {
                toast.add({ title: 'Maaf, terjadi kesalahan. Silakan coba lagi nanti.', description: 'Failed To Delete News', color: 'error' });
            }
        },
        title: 'Delete News',
        body: 'Delete News Confirmation'
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
        title: 'Publish News',
        body: 'Publish News Confirmation'
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
        title: 'Unpublish News',
        body: 'Unpublish News Confirmation'
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
        title: 'Archive News',
        body: 'Archive News Confirmation'
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
        title: 'Unarchive News',
        body: 'Unarchive News Confirmation'
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
        label: 'Hapus',
        icon: 'i-heroicons-trash',
        onSelect: () => DeleteModal(news.slug!),
        disabled: !isOrganizer.value
    },
    {
        label: 'Edit',
        icon: 'i-heroicons-pencil-square',
        onSelect: () => EditModal(news),
        disabled: !isOrganizer.value
    },
    {
        label: news.published ? 'Belum dipublikasikan' : 'Publikasikan',
        icon: news.published ? 'i-heroicons-arrow-down-on-square' : 'i-heroicons-arrow-up-on-square',
        onSelect: () => news.published ? UnpublishModal(news.slug!) : PublishModal(news.slug!),
        disabled: !isOrganizer.value
    },
    {
        label: 'Bagikan',
        icon: 'i-heroicons-share',
        onSelect: () => share(news)
    },
    {
        label: news.archived ? 'Tidak diarsipkan' : 'Arsipkan',
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
    label: 'Dasbor',
    icon: 'i-heroicons-home',
    to: '/dashboard'
}, {
    label: 'Berita',
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
        <UBreadcrumb :links="links" />
        <UCard class="p-2 mt-2 md:p-4">
            <template #header>
                <div class="flex flex-row items-center justify-between w-full p-1 md:p-2">
                    <h1 class="text-lg font-semibold text-gray-600 md:text-2xl md:font-bold dark:text-gray-200">{{
                        'Berita' }}
                    </h1>
                    <div class="min-w-24">
                        <UButton :label="'Tambah'" :size="responsiveUISizes.button" @click="AddModal" v-if="isOrganizer"
                            block />
                    </div>
                </div>
                <div class="flex flex-col gap-2 px-2 my-2 md:items-center md:justify-between md:flex-row md:px-4">
                    <UInput v-model="searchQuery" :size="responsiveUISizes.input" icon="i-heroicons-magnifying-glass"
                        placeholder="Search news..." class="mb-4 md:mb-0 md:w-64" />
                    <div class="flex flex-wrap justify-end gap-2 md:flex-row">
                        <USelectMenu v-if="!isMobile" v-model="selectedTags" :items="tags" multiple
                            :placeholder="'Filter berdasarkan {key}' /* params: { key: 'Tag' } */"
                            class="w-full md:min-w-48 md:max-w-24" :size="responsiveUISizes.input" />
                        <USelectMenu v-if="!isMobile" v-model="selectedCategory" :items="categoryOptions"
                            :placeholder="'Filter berdasarkan {key}' /* params: { key: 'Kategori' } */" multiple
                            value-key="value" class="w-full md:min-w-48 md:max-w-24" :size="responsiveUISizes.input" />
                        <UFormField class="flex flex-col items-center gap-2" :label="'Belum Dipublikasikan'" size="xs">
                            <!-- <label class="text-xs font-light text-gray-600 dark:text-gray-400" for="published">{{
                                'Belum Dipublikasikan' }}</label> -->
                            <USwitch v-model="notPublished" id="published" size="xs" />
                        </UFormField>
                        <UFormField class="flex flex-col items-center gap-2" :label="'Diarsipkan'" size="xs">
                            <!-- <label class="text-xs font-light text-gray-600 dark:text-gray-400" for="published">{{
                                'Diarsipkan' }}</label> -->
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
                                    {{ 'Dipublikasikan pada' }}
                                    <span>
                                        {{ new Date(news.publishedAt!).toLocaleDateString('id-Id', {
                                            dateStyle: "long"
                                        }) }}
                                    </span>
                                </div>
                                <span class="text-xs font-light text-red-500 ms-3" v-else-if="news.archived">
                                    {{ 'Diarsipkan pada' }}
                                    <span>
                                        {{ new Date(news.archivedAt!).toLocaleDateString('id-Id', {
                                            dateStyle: "long"
                                        }) }}
                                    </span>
                                </span>
                                <span class="text-xs font-light text-red-500 ms-3" v-else>
                                    {{ 'Belum Dipublikasikan' }}
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
                    <h1 class="text-2xl font-semibold text-gray-600 dark:text-gray-400">{{ 'Tidak Ditemukan' }}</h1>
                </div>
            </div>
            <template #footer>
                <div class="flex flex-col items-center justify-between gap-2 md:flex-row">
                    <div class="flex items-center gap-1.5 mb-2 md:mb-0">
                        <span class="text-xs leading-none md:text-sm md:leading-5">{{ 'Baris per Halaman' }}</span>
                        <USelect v-model="pagination.pageSize" :items="perPageOptions" class="w-20 me-2" size="xs" />
                    </div>
                    <div class="mb-2 md:mb-0">
                        <span class="text-xs leading-none md:text-sm md:leading-5">
                            {{ 'Menampilkan {start} hingga {end} dari {total} hasil' /* params: { start: pageFrom, end:
                            pageTo, total: pageTotal } */ }}
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