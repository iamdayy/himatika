<script setup lang="ts">
import { ModalsProjectAdd } from '#components';
import type { ICategory, IMember } from '~~/types';
import type { ICategoriesResponse, IProjectsResponse, ITagsResponse } from '~~/types/IResponse';

definePageMeta({
    layout: 'client',
    auth: false
});
useHead({
    title: 'Projects',
    meta: [
        {
            name: 'list',
            content: 'Projects'
        }
    ]
})
const overlay = useOverlay();
const AddModalComp = overlay.create(ModalsProjectAdd)
const { status } = useAuth();
const { $api } = useNuxtApp();
const { width } = useWindowSize();
const search = ref<string>("");
const selectedTags = ref<string[]>([]);
const selectedCategory = ref<string>("");
const page = ref<number>(1);
const perPage = ref<number>(10);
const notPublished = ref<boolean>(false);
const sortBy = ref<string>("Title");
const sort = computed(() => {
    if (sortBy.value === "Title") {
        return "title";
    }
    if (sortBy.value === "Date") {
        return "date";
    }
    if (sortBy.value === "Published") {
        return "publishedAt";
    }
    if (sortBy.value === "Progress") {
        return "progress";
    }
});
const order = ref<string>("");
const { data: user } = useAuth();
const { data: projects, refresh: refreshProjects } = useAsyncData(
    "projects",
    () =>
        $api<IProjectsResponse>("/api/project", {
            query: {
                page: page.value,
                perPage: perPage.value,
                notPublished: notPublished.value,
                sort: sort.value,
                order: order.value,
                search: search.value,
                categories: selectedCategory.value,
                tags: selectedTags.value,
            },
        }),
    {
        watch: [
            page,
            perPage,
            notPublished,
            sort,
            order,
            search,
            selectedCategory,
            selectedTags,
        ],
        transform: (data) => {
            const projects = data.data?.projects || [];
            return {
                data: projects,
                count: data.data?.length || 0,
            }
        },
        default: () => ({
            data: [],
            count: 0,
        }),
    }
);
const isMobile = computed(() => width.value <= 768);
const closeAlert = ref(false);

const { data: tagsData } = useLazyAsyncData(() => $api<ITagsResponse>('/api/project/tags'));
const { data: categoryOptions, refresh: refreshCategory } = useLazyAsyncData(() => $api<ICategoriesResponse>('/api/category'), {
    transform: (data) => {
        const categories = data.data?.categories || [];
        return categories.map((category) => ({
            title: category.title,
            description: category.description,
            value: category._id
        }))
    },
    default: () => []
});

const tags = computed(() => tagsData.value?.data?.tags || []);
const sortOptions = ['Date', 'Published', 'Title', 'Progress'];
/**
 * Computed properties for pagination
 */
const pageTotal = computed(() => projects.value.count || 0)
const pageFrom = computed(() => (page.value - 1) * perPage.value + 1)
const pageTo = computed(() => Math.min(page.value * perPage.value, pageTotal.value || 0))
const perPageOptions = computed(() => [10, 20, 50, 100, 200, pageTotal.value || 0]);


const AddModal = () => {
    AddModalComp.open({
        onClose: () => {
            refreshProjects();
        }
    })
}


/**
 * Responsive UI sizes for components
 */
const responsiveUISizes = computed<{ [key: string]: 'sm' | 'xs' }>(() => ({
    button: isMobile.value ? 'xs' : 'sm',
    input: isMobile.value ? 'xs' : 'sm',
}));
const links = computed(() => [{
    label: 'Beranda',
    icon: 'i-heroicons-home',
    to: '/'
}, {
    label: 'Proyek',
    icon: 'i-heroicons-code-bracket',
}]);
</script>
<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :links="links" />
        <UCard class="px-4 py-8 mt-2 md:px-8 md:py-12">
            <template #header>
                <h1 class="text-2xl font-bold text-gray-600 dark:text-white md:text-3xl">{{ 'Pameran' }}</h1>
                <UAlert v-if="!closeAlert && status == 'authenticated'" variant="outline" class="my-4">
                    <template #title>
                        <div class="flex justify-between w-full">
                            <h3 class="font-semibold text-md md:text-lg">{{ 'Register Project' }}</h3>
                            <UButton icon="i-heroicons-x-mark" :size="responsiveUISizes.button" :padded="false"
                                variant="link" color="neutral" @click="closeAlert = true" />
                        </div>
                    </template>
                    <template #description>
                        <div class="flex flex-col items-center w-full space-y-2">
                            <div class="flex flex-row items-center space-x-2 md:space-y-4 md:flex-col">
                                <!-- <NuxtImg provider="localProvider" src="/img/showcase.png"
                                    alt="Project registration illustration" class="w-12 h-12 md:w-48 md:h-48" /> -->

                                <p class="text-xs text-gray-800 dark:text-gray-400 md:text-center md:text-md">
                                    {{ 'Register Project Message' }}
                                </p>
                            </div>
                            <UButton color="primary" @click="AddModal" :disabled="status != 'authenticated'"
                                class="mx-auto">
                                {{ 'Register Project Button' }}
                            </UButton>
                        </div>
                    </template>

                    <template #actions>
                    </template>
                </UAlert>
                <UInput v-model="search" :size="responsiveUISizes.input" icon="i-heroicons-magnifying-glass"
                    :placeholder="'Cari...'" class="mt-2 mb-4 sm:mb-0 sm:w-64" />
                <div class="flex flex-col gap-2 mt-4 mb-8 md:items-center md:justify-between sm:flex-row">
                    <div class="flex items-center gap-2">
                        <USelect v-model="sortBy" :items="sortOptions" placeholder="Sort by" />
                        <UButton :size="responsiveUISizes.button" variant="ghost"
                            :icon="order == 'asc' ? 'i-heroicons-arrow-up' : order == 'desc' ? 'i-heroicons-arrow-down' : 'i-heroicons-arrows-up-down'"
                            @click="order = order == '' ? 'asc' : order == 'asc' ? 'desc' : ''" />
                    </div>
                    <div class="flex flex-col gap-2 md:items-center md:flex-row">
                        <USelectMenu v-model="selectedTags" :items="tags" multiple
                            :placeholder="'Filter berdasarkan {key}' /* params: { key: 'tags' } */" class="w-full sm:w-44" />
                        <USelectMenu v-model="selectedCategory" :items="categoryOptions" label-key="title"
                            value-key="value" :placeholder="'Filter berdasarkan {key}' /* params: { key: 'category' } */"
                            class="w-full sm:w-44" />
                        <UButton :size="responsiveUISizes.button" color="primary" variant="ghost"
                            icon="i-heroicons-arrow-path" @click="refreshProjects()">
                        </UButton>
                    </div>
                </div>
            </template>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
                <UCard v-for="project, i in projects.data" :key="i">
                    <template #header>
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-2">
                                <UBadge :label="(project.category as ICategory).title" color="secondary"
                                    variant="solid" />
                                <UBadge v-if="project.progress === 100" color="success" variant="subtle" size="xs">
                                    {{ 'Selesai' }}
                                </UBadge>
                                <UBadge v-else-if="project.progress === 0" color="neutral" variant="subtle" size="xs">
                                    {{ 'Belum Dimulai' }}
                                </UBadge>
                                <UBadge v-else color="secondary" variant="subtle" size="xs">{{ 'Sedang Berlangsung' }}
                                </UBadge>
                            </div>
                            <UButton variant="link" :size="responsiveUISizes.button" color="neutral" :to="project.url"
                                icon="i-heroicons-arrow-top-right-on-square" />
                        </div>
                        <div class="max-w-md mx-auto overflow-hidden rounded-lg">
                            <NuxtImg provider="localProvider" :src="(project.image as string)" :alt="project.title"
                                class="object-cover w-full h-full" loading="lazy" />
                        </div>
                    </template>
                    <div class="space-y-2">
                        <NuxtLink :to="`/projects/${project._id}`" class="text-lg font-semibold">{{ project.title }}
                        </NuxtLink>
                        <div class="flex w-full gap-2">
                            <UBadge v-for="tag in project.tags" :key="tag" :label="tag" color="neutral" variant="soft"
                                size="xs" />
                        </div>
                        <div class="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-200/50">
                            <UIcon name="i-heroicons-calendar" />
                            <h1>{{ new Date(project.date).toLocaleDateString('id-ID', { dateStyle: 'long' }) }}</h1>
                        </div>
                        <UProgress :model-value="Math.ceil(project.progress / 20)"
                            :color="project.progress === 100 ? 'success' : 'secondary'" status
                            :max="['Not Started', 'Starting', 'On Progress', 'On Progress', 'On Progress', 'Complete']" />
                    </div>
                    <template #footer>
                        <div class="flex items-center justify-between text-xs text-gray-500">
                            <div>
                                <h1 class="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    {{ 'Dipublikasikan pada' }}: </h1>
                                <h1 class="text-xs font-medium text-gray-600 dark:text-gray-300">
                                    {{
                                        project.published ?
                                            new Date(project.publishedAt!).toLocaleDateString('id-ID', {
                                                dateStyle: 'long'
                                            }) :
                                            'not published'
                                    }}</h1>
                            </div>
                            <UAvatarGroup size="sm" :max="3">
                                <UAvatar v-for="member in project.members" :key="(member as IMember).NIM"
                                    :src="(member as IMember).avatar" :alt="(member as IMember).fullName" />
                            </UAvatarGroup>
                        </div>
                    </template>
                </UCard>
            </div>
            <template #footer>
                <div class="flex flex-wrap justify-between">
                    <div class="flex items-center gap-1.5 mb-2 sm:mb-0">
                        <span class="text-sm leading-5">Rows per page:</span>
                        <USelect v-model="perPage" :items="perPageOptions" class="w-20 me-2" size="xs" />
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
