<script setup lang="ts">
import { ModalsConfirmation, ModalsProjectAdd, ModalsProjectEdit } from '#components';
import type { DropdownMenuItem } from '@nuxt/ui';
import type { DriveStep } from 'driver.js';
import type { ICategory, IMember, IProject } from '~~/types';
import type { ICategoriesResponse, IProjectsResponse, ITagsResponse } from '~~/types/IResponse';

definePageMeta({
    layout: 'dashboard',
});
const overlay = useOverlay();
const organizerStore = useOrganizerStore();
const { isOrganizer } = storeToRefs(organizerStore);
const { $api, $pageGuide } = useNuxtApp();
const toast = useToast();
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
const { data: projects, refresh: refreshProjects } = useLazyAsyncData(
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
// const { projects, notPublished, refreshProjects, search, selectedCategory, selectedTags, page, perPage, totalProjects, sortBy, order } = useProjects();
const isMobile = computed(() => width.value <= 768);

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

const ConfirmationModal = overlay.create(ModalsConfirmation);
const AddProjectModal = overlay.create(ModalsProjectAdd);
const EditProjectModal = overlay.create(ModalsProjectEdit);
/**
 * Publish a project
 * @param {string} id - The id of the project to publish
 */
const publishProject = async (id: string) => {
    try {
        const publish = await $api('/api/project/publish', {
            query: { id }
        });
        toast.add({ title: publish.statusMessage! });
        refreshProjects();
    } catch (error) {
        toast.add({ title: 'Failed To Publish Project' });
    }
}

const AddModal = () => {
    AddProjectModal.open({
        onClose: () => {
            refreshProjects();
        }
    })
}
const EditModal = (project: IProject) => {
    EditProjectModal.open({
        project,
    })
}


/**
 * Open confirmation modal to delete a project
 * @param {string} slug - The slug of the project to delete
 */
const DeleteModal = (id: string) => {
    ConfirmationModal.open({
        async onConfirm() {
            try {
                const deleted = await $api('/api/project', {
                    method: 'DELETE',
                    query: { id }
                });
                toast.add({ title: deleted.statusMessage! });
                refreshProjects();
                ConfirmationModal.close();
            } catch (error) {
                toast.add({ title: 'Failed To delete Project' });
            }
        },
        title: 'Project delete Confirmation',
        body: 'Are you sure to delete this project ?'
    })
}

/**
 * Open confirmation modal to publish a project
 * @param {string} slug - The slug of the project to publish
 */
const PublishModal = (id: string) => {
    ConfirmationModal.open({
        async onConfirm() {
            try {
                await publishProject(id);
                ConfirmationModal.close();
            } catch (error) {
                toast.add({ title: 'Failed to publish Project' });
            }
        },
        title: 'Project Publish Confirmation',
        body: 'Are you sure you want to publish this project?'
    })
}

/**
 * Generate dropdown items for each project
 * @param {IProject} project - The project to generate items for
 * @returns {Array} Array of dropdown items
 */
const items = (project: IProject): DropdownMenuItem[][] => [[
    {
        label: 'Delete',
        icon: 'i-heroicons-trash',
        onSelect: () => DeleteModal(project._id as string),
        disabled: !isOrganizer.value
    },
    {
        label: 'Edit',
        icon: 'i-heroicons-pencil-square',
        onSelect: () => EditModal(project),
        disabled: !isOrganizer.value
    },
    {
        label: 'Publish',
        icon: 'i-ion-arrow-up-right-box-outline',
        onSelect: () => PublishModal(project._id as string),
        disabled: !isOrganizer.value
    }
]]
const links = computed(() => [{
    label: 'Dashboard',
    icon: 'i-heroicons-home',
    to: '/dashboard'
}, {
    label: 'Projects',
    icon: 'i-heroicons-code-bracket',
}]);
/**
 * Responsive UI sizes for components
 */
const responsiveUISizes = computed<{ [key: string]: 'md' | 'xs' }>(() => ({
    button: isMobile.value ? 'xs' : 'md',
    input: isMobile.value ? 'xs' : 'md',
}));
onMounted(() => {
    const steps: DriveStep[] = [
        {
            element: '#add-project',
            popover: {
                title: 'Add New Project',
                description: 'Click here to add a new project',
                side: 'bottom'
            }
        },
        {
            element: '#filter',
            popover: {
                title: 'Filter Projects',
                description: 'You can filter projects by tags, categories, and published status',
                side: 'bottom'
            }
        },
        {
            element: '#card-0',
            popover: {
                title: 'Project Card',
                description: 'This is a project card, you can click on the card to view the project details',
                side: 'top'
            }
        },
        {
            element: '#card-0 #dropdown',
            popover: {
                title: 'Project Actions',
                description: 'You can perform actions like edit, delete, and publish a project from here',
                side: 'top'
            }
        }
    ]
    $pageGuide('project', steps, {
        showProgress: true,
        showButtons: ['next', 'previous'],
    });
})
</script>
<template>
    <div class="items-center justify-center mb-24">
        <UCard class="p-2 mt-2 md:p-4">
            <template #header>
                <UBreadcrumb :links="links" />
                <div class="p-1 md:p-2">
                    <div class="flex flex-row items-center justify-between gap-2">
                        <h1 class="text-lg font-semibold text-gray-600 md:text-2xl md:font-bold dark:text-gray-200">
                            Projects
                        </h1>
                        <div class="min-w-24">
                            <UButton id="add-project" label="New" :size="responsiveUISizes.button" @click="AddModal"
                                v-if="isOrganizer" block />
                        </div>
                    </div>
                    <UInput v-model="search" :size="responsiveUISizes.input" icon="i-heroicons-magnifying-glass"
                        placeholder="Search news..." class="mt-4 mb-4 sm:mb-0 sm:w-64" />
                    <div id="filter" class="flex-row items-center justify-between hidden gap-2 mt-4 mb-8 md:flex">
                        <div class="flex items-center gap-2">
                            <USelect v-model="sortBy" :items="sortOptions" placeholder="Sort by" />
                            <UButton :size="responsiveUISizes.button" color="primary" variant="ghost"
                                :icon="order == 'asc' ? 'i-heroicons-arrow-up' : order == 'desc' ? 'i-heroicons-arrow-down' : 'i-heroicons-arrows-up-down'"
                                @click="order = order == '' ? 'asc' : order == 'asc' ? 'desc' : ''" />
                        </div>
                        <div class="flex flex-row items-center gap-2">
                            <USelectMenu v-model="selectedTags" :items="tags" multiple placeholder="Filter by tags" />
                            <USelectMenu v-model="selectedCategory" :items="categoryOptions"
                                placeholder="Filter by category" label-key="title" value-key="title" />
                            <div class="flex flex-col items-center gap-2">
                                <label class="text-xs font-light text-gray-600 dark:text-gray-400" for="published">Not
                                    published</label>
                                <USwitch v-model="notPublished" :disabled="!isOrganizer" id="published" size="xs" />
                            </div>
                            <UButton :size="responsiveUISizes.button" color="primary" variant="ghost"
                                icon="i-heroicons-arrow-path" @click="refreshProjects()">
                            </UButton>
                        </div>
                    </div>
                </div>
            </template>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <UCard v-for="project, i in projects.data" :id="`card-${i}`" :key="i">
                    <template #header>
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-2">
                                <UBadge :label="(project.category as ICategory).title" color="secondary"
                                    variant="solid" />
                                <UBadge v-if="project.progress === 100" color="success" variant="subtle" size="xs">
                                    Completed
                                </UBadge>
                                <UBadge v-else-if="project.progress === 0" color="error" variant="subtle" size="xs">Not
                                    Started
                                </UBadge>
                                <UBadge v-else color="secondary" variant="subtle" size="xs">Onprogress</UBadge>
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
                        <div class="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-300">
                            <UIcon name="i-heroicons-calendar" />
                            <h1>{{ new Date(project.date).toLocaleDateString('id-ID', { dateStyle: 'long' }) }}</h1>
                        </div>
                        <UProgress :model-value="Math.ceil(project.progress / 20)"
                            :color="project.progress === 100 ? 'success' : 'secondary'" status
                            :max="['Not Started', 'Starting', 'On Progress', 'On Progress', 'On Progress', 'Complete']" />
                    </div>
                    <template #footer>
                        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-300">
                            <div class="space-y-2 ">
                                <h1 class="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    published at: {{
                                        project.published ?
                                            new Date(project.publishedAt!).toLocaleDateString('id-ID', { dateStyle: 'long' }) :
                                            'not published'
                                    }}</h1>
                                <UAvatarGroup size="sm" :max="3">
                                    <UAvatar v-for="member in project.members" :key="(member as IMember).NIM"
                                        :src="(member as IMember).avatar" :alt="(member as IMember).fullName" />
                                </UAvatarGroup>
                            </div>
                            <UDropdownMenu id="dropdown" :items="items(project)">
                                <UButton icon="i-ion-ellipsis-vertical" variant="ghost" color="neutral" />
                            </UDropdownMenu>
                        </div>
                    </template>
                </UCard>
            </div>
            <template #footer>
                <div class="flex flex-col items-center justify-between gap-2 md:flex-row">
                    <div class="flex items-center gap-1.5 mb-2 sm:mb-0">
                        <span class="text-xs leading-none md:text-sm md:leading-5">Rows per page:</span>
                        <USelect v-model="perPage" :items="perPageOptions" class="w-20 me-2" size="xs" />
                    </div>
                    <div class="mb-2 sm:mb-0">
                        <span class="text-xs leading-none md:text-sm md:leading-5">
                            Showing
                            <span class="font-medium">{{ pageFrom }}</span>
                            to
                            <span class="font-medium">{{ pageTo }}</span>
                            of
                            <span class="font-medium">{{ pageTotal }}</span>
                            results
                        </span>
                    </div>
                    <UPagination v-model:page="page" :items-per-page="perPage" :total="pageTotal"
                        :sibling-count="isMobile ? 2 : 6" />
                </div>
            </template>
        </UCard>
    </div>
</template>
