<script setup lang='ts'>
import { ModalsConfirmation, UBadge, UButton, UCheckbox, VideoPlayer } from '#components';
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui';
import type { IAspiration, IDoc, IMember, IPhoto, IVideo, IVote } from '~~/types';
import type { IAspirationResponse, IExportSheetResponse } from '~~/types/IResponse';

const UDropdownMenu = resolveComponent('UDropdownMenu');
/**
 * Page metadata configuration
 */
definePageMeta({
    layout: 'dashboard',
    middleware: 'sidebase-auth'
});
const config = useRuntimeConfig();
/**
 * Set page title
 */
useHead({
    title: 'Aspirations',
});

useSeoMeta({
    title: 'Aspirations',
    description: 'View and manage aspirations',
    keywords: 'aspirations, manage, view',
    ogTitle: 'Aspirations',
    ogDescription: 'View and manage aspirations',
    ogType: 'website',
    ogImage: '/img/logo.png',
    ogUrl: `${config.public.public_uri}/aspirations`,
})

type responsive = {
    [key: string]: 'xs' | 'md';
}

const { $api, $router } = useNuxtApp();
const { $ts } = useI18n();

/**
 * User role and department hooks
 */
const organizerStore = useOrganizerStore();
const { isOrganizer } = storeToRefs(organizerStore);

/**
 * Modal and toast hooks
 */
const overlay = useOverlay();
const toast = useToast();

const ConfirmationModal = overlay.create(ModalsConfirmation)

/**
 * Responsive design
 */
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 640);

/**
 * Responsive UI sizes based on screen width
 */
const responsiveUISizes = computed<responsive>(() => ({
    input: isMobile.value ? 'xs' : 'md',
    button: isMobile.value ? 'xs' : 'md',
    select: isMobile.value ? 'xs' : 'md',
}));

/**
 * Table columns configuration
 */
const columns = computed<TableColumn<IAspiration>[]>(() => [
    {
        id: 'select',
        header: ({ table }) =>
            h(UCheckbox, {
                modelValue: table.getIsSomePageRowsSelected()
                    ? 'indeterminate'
                    : table.getIsAllPageRowsSelected(),
                'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
                    table.toggleAllPageRowsSelected(!!value),
                'aria-label': 'Select all'
            }),
        cell: ({ row }) =>
            h(UCheckbox, {
                modelValue: row.getIsSelected(),
                'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
                'aria-label': 'Select row'
            })
    },
    {
        id: 'expand',
        cell: ({ row }) =>
            h(UButton, {
                color: 'neutral',
                variant: 'ghost',
                icon: 'i-lucide-chevron-down',
                square: true,
                'aria-label': 'Expand',
                ui: {
                    leadingIcon: 'transition-transform ' + (row.getIsExpanded() ? 'duration-200 rotate-180' : '')
                },
                onClick: () => row.toggleExpanded()
            })
    },
    {
        id: 'number',
        header: '#',
        cell: ({ row }) => {
            return (pagination.value.pageIndex - 1) * pagination.value.pageSize + row.index + 1;
        },
        size: 50,
    },
    {
        accessorKey: 'subject',
        header: $ts('subject'),
        cell: ({ row }) => {
            return row.getValue('subject') || 'N/A';
        },
    },
    {
        accessorKey: 'from',
        header: $ts('from'),
        cell: ({ row }) => {
            return (row.getValue('from') as IMember)?.fullName || 'Anonymous';
        },
    },
    {
        accessorKey: 'upVotes',
        header: $ts('up_vote'),
        cell: ({ row }) => {
            return row.original.votes?.filter((vote: IVote) => vote.voteType == 'upvote').length || 0;
        },
    },
    {
        accessorKey: 'downVotes',
        header: $ts('down_vote'),
        cell: ({ row }) => {
            return row.original.votes?.filter((vote: IVote) => vote.voteType == 'downvote').length || 0;
        },
    },
    {
        accessorKey: 'status',
        header: $ts('status'),
        cell: ({ row }) => {
            const status = row.original.deleted ? 'deleted' : row.original.archived ? 'archived' : row.original.read ? 'read' : 'unread';
            const color = status == 'deleted' ? 'error' : status == 'archived' ? 'info' : status == 'read' ? 'success' : 'secondary';
            return h(UBadge, { color }, () => {
                return h('span', { class: 'text-xs font-semibold capitalize' }, status);
            });
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            return h(UDropdownMenu, {
                items: items(row.original)
            }, {
                default: () => h(UButton, {
                    color: 'neutral',
                    variant: 'ghost',
                    icon: 'i-heroicons-ellipsis-horizontal',
                    size: responsiveUISizes.value.button
                })
            });
        },
    },
]);

// const selectedColumns = ref(columns);
// const columnsTable = computed(() => columns.filter((column) => selectedColumns.value.includes(column)));

/**
 * Selected rows management
 */
const selectedRows = ref<{
    [key: number]: boolean
}>({});

const selectedAspirations = computed(() => {
    return data.value.data?.aspirations?.filter((row: IAspiration, index) => {
        return selectedRows.value[index] !== undefined && selectedRows.value[index] !== null;
    }) || [];
});


/**
 * Search and filter state
 */
const search = ref('');
const filterBy = ref<{ value: "enteredYear" | "class" | "semester", label: string } | null>(null);
const filter = ref<string[]>([]);
const deleted = ref<boolean>(false);

/**
 * Reset all filters
 */
const resetFilters = () => {
    search.value = '';
    filter.value = [];
    filterBy.value = null;
};

/**
 * Pagination and sorting state
 */
const sort = ref({ column: 'createdAt', direction: 'asc' as const });
const pagination = ref({
    pageIndex: 1,
    pageSize: 10,
})

/**
 * Fetch data from API
 */
const { data, status, refresh } = await useLazyAsyncData('users', () => $api<IAspirationResponse>('/api/aspiration', {
    query: {
        search: search.value,
        page: pagination.value.pageIndex,
        perPage: pagination.value.pageSize,
        sort: sort.value.column,
        order: sort.value.direction,
        filterBy: filterBy.value?.value,
        filter: filter.value,
        deleted: deleted.value
    }
}), {
    default: () => ({
        data: {
            aspirations: [],
            filters: [],
            length: 0
        }
    }),
    watch: [() => pagination.value.pageIndex, () => pagination.value.pageSize, search, sort, filter, filterBy, deleted],
    deep: true,
});

/**
 * Computed properties for pagination
 */
const pageTotal = computed(() => data.value.data?.length || 0);
const pageFrom = computed(() => (pagination.value.pageIndex - 1) * pagination.value.pageSize + 1);
const pageTo = computed(() => Math.min(pagination.value.pageIndex * pagination.value.pageSize, pageTotal.value));
const perPageOptions = computed(() => {
    const baseOptions = [5, 10, 20, 50, 100];
    const filteredOptions = baseOptions.filter((option) => option <= pageTotal.value);

    if (isMobile.value && filteredOptions.length > 3) {
        return filteredOptions.slice(0, 3);
    }

    return filteredOptions;
});

/**
 * Delete a aspiration
 * @param {number} NIM - The NIM of the aspiration to delete
 */
const deleteAspiration = async (id: string) => {
    try {
        const deleted = await $api('/api/aspiration', {
            method: 'delete',
            query: { id }
        });
        toast.add({ title: deleted.statusMessage });

    } catch (error: any) {
        toast.add({ title: error.statusMessage });
    }
};
/**
 * Archive a aspiration
 * @param {number} id - The NIM of the aspiration to archive
 */
const archiveAspiration = async (id: string) => {
    try {
        const archived = await $api('/api/aspiration/archive', {
            method: 'post',
            query: { id }
        });
        toast.add({ title: archived.statusMessage });

    } catch (error: any) {
        toast.add({ title: error.statusMessage });
    }
};

const viewAspiration = async (id: string) => {
    $router.push(`/dashboard/aspirations/${id}`);
};


/**
 * Generate Excel file for export
 */
const generateXlsx = async () => {
    try {
        let toExcel = selectedAspirations.value;
        if (Object.keys(selectedRows.value).length > 0) {
            const data = (await $api<IAspirationResponse>('/api/aspiration')).data?.aspirations || [];
            toExcel = data;
        }
        const response = await $fetch<IExportSheetResponse>('/api/sheet/export', {
            method: "post",
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
            body: {
                title: "exported-" + toExcel.length,
                data: toExcel.map((row: IAspiration) => {
                    return {
                        'Subject': row.subject,
                        'Message': row.message,
                        'From': row.from ? (row.from as IMember)?.fullName : 'Anonymous',
                        'Up Vote': row.votes?.filter((vote: IVote) => vote.voteType == 'upvote').length,
                        'Down Vote': row.votes?.filter((vote: IVote) => vote.voteType == 'downvote').length,
                        'Status': row.deleted ? 'Deleted' : row.archived ? 'Archived' : row.read ? 'Read' : 'Unread',
                        'proofs Photo': row.proofs?.photos?.map(((photo: IPhoto) => config.public.public_uri + photo.image as string)).join(', '),
                        'proofs Video': row.proofs?.videos?.map(((video: IVideo) => config.public.public_uri + video.video as string)).join(', '),
                        'proofs Document': row.proofs?.docs?.map(((document: IDoc) => config.public.public_uri + document.doc as string)).join(', '),
                    };
                })
            }
        });
        const link = document.createElement('a');
        link.href = response.data?.url || '';
        link.download = response.data?.title || 'exported.xlsx';
        document.body.appendChild(link);
        link.click();
    } catch (error) {
        console.error('Error generating Excel file:', error);
    }
};

/**
 * Watch for changes in search and filter to reset page
 */
watch([search, filter], () => {
    pagination.value.pageIndex = 1;
});


/**
 * Open delete confirmation modal
 * @param {number} NIM - The NIM of the aspiration to delete
 */
const deleteModal = (aspiration: IAspiration) => {
    ConfirmationModal.open({
        title: "Confirm delete",

        body: "Really to delete aspiration with id " + aspiration.subject + "?",
        onConfirm() {
            deleteAspiration(aspiration._id as string).then(() => { ConfirmationModal.close(); refresh(); });
        }
    });

};

const archiveModal = (aspiration: IAspiration) => {
    ConfirmationModal.open({
        title: "Confirm archive",
        body: "Really to archive aspiration with id " + aspiration.subject + "?",
        onConfirm() {
            archiveAspiration(aspiration._id as string).then(() => { ConfirmationModal.close(); refresh(); });
        }
    });
};
/**

 * Generate dropdown items for each row
 * @param {any} row - The row data
 * @returns {Array} Array of dropdown items
 */
const items = (row: IAspiration): DropdownMenuItem[][] => [
    [
        {
            label: 'Delete',
            icon: 'i-heroicons-trash-20-solid',
            disabled: row.deleted,
            onSelect: () => deleteModal(row)
        },
        {
            label: 'View',
            icon: 'i-heroicons-eye-20-solid',
            onSelect: () => viewAspiration(row._id as string)
        },
        {
            label: 'Archive',
            icon: 'i-heroicons-archive-box-x-mark-20-solid',
            onSelect: () => archiveModal(row)
        }
    ]

];
const links = computed(() => [{
    label: $ts('dashboard'),
    icon: 'i-heroicons-home',
    to: '/dashboard'
}, {
    label: $ts('aspiration'),
    icon: 'i-heroicons-clipboard-document-list',
}]);
</script>
<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :items="links" />
        <UCard class="p-2 mt-2 md:p-4">
            <template #header>
                <div class="flex items-center w-full gap-3 p-1 my-4 md:p-2 md:justify-between">
                    <h2 class="text-lg font-semibold text-gray-600 md:text-2xl md:font-bold dark:text-gray-200">
                        {{ $ts('aspiration') }}
                    </h2>
                    <UButton icon="i-heroicons-plus" color="success" v-if="isOrganizer" :size="responsiveUISizes.button"
                        to="/dashboard/aspirations/create">
                        {{ $ts('create_aspiration') }}
                    </UButton>
                </div>
            </template>

            <div class="w-full py-3">
                <!-- Filters -->
                <div class="flex flex-col items-center justify-between gap-3 px-4 py-3 md:flex-row">
                    <UInput v-model="search" icon="i-heroicons-magnifying-glass-20-solid" placeholder="Search..."
                        :size="responsiveUISizes.input" class="w-full md:w-auto" />
                    <div class="flex flex-col w-full gap-3 md:flex-row md:w-auto">
                        <!-- <USelectMenu v-model="filterBy" :options="filterable" placeholder="Filter By"
                            :size="responsiveUISizes.select" class="w-full md:w-40" />
                        <USelectMenu v-model="filter" :options="data.data.filters" multiple
                            :placeholder="filterBy?.label || 'none'" :disabled="!filterBy"
                            :size="responsiveUISizes.select" class="w-full md:w-40" /> -->
                    </div>
                </div>

                <!-- Header and Action buttons -->
                <div class="flex flex-col w-full gap-3 px-4 py-3 md:items-center md:justify-between md:flex-row">
                    <UButton v-if="selectedAspirations.length > 1" icon="i-heroicons-arrow-down-tray" trailing
                        color="neutral" :size="responsiveUISizes.button" @click="generateXlsx">
                        Export Selected
                    </UButton>
                    <UButton v-else icon="i-heroicons-arrow-down-tray" trailing color="neutral"
                        :size="responsiveUISizes.button" @click="generateXlsx">
                        Export All
                    </UButton>
                    <div class="flex flex-wrap gap-1.5 md:items-center justify-start md:justify-end">

                        <!-- <USelectMenu v-model="selectedColumns" :options="columns" multiple v-if="!isMobile">
                            <UButton icon="i-heroicons-view-columns" color="neutral" :size="responsiveUISizes.button">
                                Columns
                            </UButton>
                        </USelectMenu> -->

                        <UButton icon="i-heroicons-funnel" color="neutral" :size="responsiveUISizes.button"
                            v-if="!isMobile" :disabled="search === '' && filter.length === 0" @click="resetFilters">
                            Reset
                        </UButton>
                        <div class="flex flex-col items-center gap-2">
                            <label class="text-xs font-light text-gray-600 dark:text-gray-400" for="deleted">{{
                                $ts('show_deleted')
                                }}</label>
                            <USwitch v-model="deleted" id="deleted" size="xs" />
                        </div>
                        <UButton icon="i-heroicons-arrow-path" variant="ghost" :size="responsiveUISizes.button"
                            @click="refresh()" :loading="status === 'pending'">
                        </UButton>
                    </div>
                </div>

                <!-- Table -->
                <UTable :data="data.data?.aspirations" :columns="columns" :loading="status === 'pending'" class="w-full"
                    v-model:pagination="pagination" v-model:row-selection="selectedRows">
                    <template #expanded="{ row }">
                        <div class="p-4 text-sm text-gray-600 dark:text-gray-300">
                            <h3 class="mb-2 font-semibold">Message</h3>
                            <p>{{ row.original.message }}</p>
                            <h3 class="mt-4 mb-2 font-semibold">Proofs</h3>
                            <div class="flex flex-wrap gap-2">
                                <div v-for="(photo, i) in row.original.proofs?.photos" :key="i"
                                    class="w-1/2 p-1 md:w-1/4">
                                    <NuxtImg :src="photo.image as string" provider="localProvider"
                                        :alt="'Proof ' + (i + 1)" class="object-cover w-full h-auto" loading="lazy" />
                                </div>
                                <div v-for="(video, i) in row.original.proofs?.videos" :key="i"
                                    class="w-1/2 p-1 md:w-1/4">
                                    <VideoPlayer :src="video.video as string" :alt="'Proof ' + (i + 1)"
                                        class="object-cover w-full h-auto" />
                                </div>
                                <div v-for="(document, i) in row.original.proofs?.docs" :key="i"
                                    class="w-1/2 p-1 md:w-1/4">
                                    <div
                                        class="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg dark:border-gray-600">
                                        <i
                                            class="i-heroicons-document-text-20-solid text-4xl text-gray-500 dark:text-gray-400"></i>
                                        <span class="mt-2 text-sm text-center text-gray-600 dark:text-gray-300">
                                            {{ document.doc }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </UTable>
            </div>
            <!-- Number of rows & Pagination -->
            <template #footer>
                <div class="flex flex-col items-center justify-between gap-2 md:flex-row">
                    <div class="flex items-center gap-1.5 mb-2 sm:mb-0">
                        <span class="text-xs leading-none md:text-sm md:leading-5">{{ $ts('rows_per_page') }}</span>
                        <USelect v-model="pagination.pageSize" :items="perPageOptions" class="w-20 me-2" size="xs" />
                    </div>
                    <div class="mb-2 sm:mb-0">
                        <span class="text-xs leading-none md:text-sm md:leading-5">
                            {{ $ts('showing_results', { start: pageFrom, end: pageTo, total: pageTotal }) }}
                        </span>
                    </div>
                    <UPagination v-model:page="pagination.pageIndex" :items-per-page="pagination.pageSize"
                        :total="pageTotal" :sibling-count="isMobile ? 2 : 6" />
                </div>
            </template>
        </UCard>
    </div>
</template>
<style scoped></style>