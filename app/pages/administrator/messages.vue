<script setup lang='ts'>
// TODO: improve this page
import { ModalsConfirmation } from '#components';
import type { TableColumn } from '@nuxt/ui';
import type { IMessage } from '~~/types';
import type { IMessageResponse } from '~~/types/IResponse';
const UDropdownMenu = resolveComponent('UDropdownMenu');
/**
 * Page metadata configuration
 */
definePageMeta({
    layout: 'dashboard',
    middleware: 'sidebase-auth'
});

/**
 * Set page title
 */
useHead({
    title: 'Messages'
});

type responsive = {
    [key: string]: 'xs' | 'md';
}

const { $api } = useNuxtApp();
const { $ts } = useI18n();

/**
 * Modal and toast hooks
 */
const overlay = useOverlay();
const toast = useToast();

const ConfirmationModal = overlay.create(ModalsConfirmation);

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
 * Selected rows management
 */
const selectedRows = ref<any[]>([]);

/**
 * Handle row selection
 * @param {any} row - The row to be selected or deselected
 */
function select(row: any) {
    const index = selectedRows.value.findIndex((item: { id: any; }) => item.id === row.id);
    if (index === -1) {
        selectedRows.value.push(row);
    } else {
        selectedRows.value.splice(index, 1);
    }
}


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
const page = ref(1);
const perPage = ref(10);

/**
 * Fetch data from API
 */
const { data, pending, refresh } = await useLazyAsyncData('users', () => $api<IMessageResponse>('/api/message', {
    query: {
        search: search.value,
        page: page.value,
        perPage: perPage.value,
        sort: sort.value.column,
        order: sort.value.direction,
        filterBy: filterBy.value?.value,
        filter: filter.value,
        deleted: deleted.value
    }
}), {
    default: () => ({
        data: {
            messages: [],
            filters: [],
            length: 0
        }
    }),
    watch: [page, search, perPage, sort, filter, filterBy, deleted]
});

/**
 * Computed properties for pagination
 */
const pageTotal = computed(() => data.value.data?.length || 0);
const pageFrom = computed(() => (page.value - 1) * perPage.value + 1);
const pageTo = computed(() => Math.min(page.value * perPage.value, pageTotal.value));
const perPageOptions = computed(() => {
    const baseOptions = [5, 10, 20, 50, 100];
    const filteredOptions = baseOptions.filter((option) => option <= pageTotal.value);

    if (isMobile.value && filteredOptions.length > 3) {
        return filteredOptions.slice(0, 3);
    }

    return filteredOptions;
});


/**
 * Table columns configuration
 */
const columns = computed<TableColumn<IMessage>[]>(() => [
    {
        id: 'id',
        label: '#',
        size: 50,
        cell: ({ row }) => {
            return row.index + 1;
        },
    },
    {
        accessorKey: 'subject',
        header: $ts('subject'),
        size: 200,
        cell: ({ row }) => {
            return row.getValue('subject') || 'No Subject';
        },
    },
    {
        accessorKey: 'from',
        header: $ts('from'),
        size: 200,
        cell: ({ row }) => {
            return `${row.original.name.first} ${row.original.name.last}` || 'Anonymous';
        },
    },
    {
        accessorKey: 'status',
        header: $ts('status'),
        size: 100,
        cell: ({ row }) => {
            return row.getValue('status') || 'Unknown';
        },
    },
    {
        id: 'actions',
        header: $ts('actions'),
        size: 100,
        cell: ({ row }) => {
            return h(UDropdownMenu)
        },
    }
]);


/**
 * Delete a message
 * @param {number} NIM - The NIM of the message to delete
 */
const deleteMessage = async (id: string) => {
    try {
        const deleted = await $api('/api/message', {
            method: 'delete',
            query: { id }
        });
        toast.add({ title: deleted.statusMessage });

    } catch (error: any) {
        toast.add({ title: error.statusMessage });
    }
};

const archiveMessage = async (id: string) => {
    try {
        const archived = await $api('/api/message/archive', {
            method: 'post',
            query: { id }
        });
        toast.add({ title: archived.statusMessage });

    } catch (error: any) {
        toast.add({ title: error.statusMessage });
    }
};


/**

 * Generate Excel file for export
 */
const generateXlsx = async () => {
    try {
        let toExcel = selectedRows.value;
        if (selectedRows.value.length == 0) {
            toExcel = (await $api<IMessageResponse>('/api/message')).data?.messages || [];
        }
        const response = await $fetch<Blob>('/api/sheet/export', {
            method: "post",
            responseType: 'blob',
            body: {
                title: "exported-" + toExcel.length,
                data: toExcel
            }
        });
        const blob = response;
        if (!blob) return;

        const title = `exported-${toExcel.length}-data-${new Date()}`;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${title}-${new Date()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error generating Excel file:', error);
    }
};

/**
 * Watch for changes in search and filter to reset page
 */
watch([search, filter], () => {
    page.value = 1;
});


/**
 * Open delete confirmation modal
 * @param {number} NIM - The NIM of the message to delete
 */
const deleteModal = (id: string) => {
    ConfirmationModal.open({
        title: $ts('delete_message'),

        body: $ts('delete_message_confirmation', { id }),
        onConfirm() {
            deleteMessage(id).then(() => { ConfirmationModal.close(); refresh(); });
        }
    });

};

const archiveModal = (id: string) => {
    ConfirmationModal.open({
        title: $ts('archive_message'),
        body: $ts('archive_message_confirmation', { id }),
        onConfirm() {
            archiveMessage(id).then(() => { ConfirmationModal.close(); refresh(); });
        }
    });
};

/**

 * Generate dropdown items for each row
 * @param {any} row - The row data
 * @returns {Array} Array of dropdown items
 */
const items = (row: any) => [
    [
        {
            label: $ts('delete'),
            icon: 'i-heroicons-trash-20-solid',
            disabled: row.status == 'deleted',
            click: () => deleteModal(row._id)
        },
        {
            label: $ts('archive'),
            icon: 'i-heroicons-archive-box-x-mark-20-solid',
            click: () => archiveModal(row._id)
        }
    ]

];
const links = computed(() => [{
    label: $ts('dashboard'),
    icon: 'i-heroicons-home',
    to: '/dashboard'
}, {
    label: $ts('message'),
    icon: 'i-heroicons-archive-box',
}]);
</script>
<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :items="links" />
        <UCard class="p-2 mt-2 md:p-4">
            <template #header>
                <div class="flex flex-row items-center justify-between w-full p-1 md:p-2">
                    <h2 class="text-lg font-semibold text-gray-600 md:text-2xl md:font-bold dark:text-gray-200">Messages
                    </h2>
                </div>
            </template>

            <div class="w-full py-3">
                <!-- Filters -->
                <div class="flex flex-col items-center justify-between gap-3 px-4 py-3 md:flex-row">
                    <UInput v-model="search" icon="i-heroicons-magnifying-glass-20-solid" placeholder="Search..."
                        :size="responsiveUISizes.input" class="w-full md:w-auto" />
                    <div class="flex flex-col w-full gap-3 md:flex-row md:w-auto">
                        <!-- <USelectMenu v-model="filterBy" :items="filterable" placeholder="Filter By"
                            :size="responsiveUISizes.select" class="w-full md:w-40" />
                        <USelectMenu v-model="filter" :items="data.data.filters" multiple
                            :placeholder="filterBy?.label || 'none'" :disabled="!filterBy"
                            :size="responsiveUISizes.select" class="w-full md:w-40" /> -->
                    </div>
                </div>

                <!-- Header and Action buttons -->
                <div class="flex flex-col w-full gap-3 px-4 py-3 md:items-center md:justify-between md:flex-row">
                    <UButton v-if="selectedRows.length > 1" icon="i-heroicons-arrow-down-tray" trailing color="neutral"
                        :size="responsiveUISizes.button" @click="generateXlsx">
                        Export Selected
                    </UButton>
                    <UButton v-else icon="i-heroicons-arrow-down-tray" trailing color="neutral"
                        :size="responsiveUISizes.button" @click="generateXlsx">
                        Export All
                    </UButton>
                    <div class="flex flex-wrap gap-1.5 md:items-center justify-start md:justify-end">
                        <!--
    <USelectMenu v-model="selectedColumns" :items="columns" multiple v-if="!isMobile">
        <UButton icon="i-heroicons-view-columns" color="gray" :size="responsiveUISizes.button">
            Columns
        </UButton>
    </USelectMenu>
                        -->
                        <UButton icon="i-heroicons-funnel" color="neutral" :size="responsiveUISizes.button"
                            v-if="!isMobile" :disabled="search === '' && filter.length === 0" @click="resetFilters">
                            Reset
                        </UButton>
                        <div class="flex flex-col items-center gap-2">
                            <label class="text-xs font-light text-gray-600 dark:text-gray-400" for="deleted">Show
                                deleted</label>
                            <USwitch v-model="deleted" id="deleted" size="xs" />
                        </div>
                        <UButton icon="i-heroicons-arrow-path" variant="ghost" :size="responsiveUISizes.button"
                            @click="refresh()" :loading="pending">
                        </UButton>
                    </div>
                </div>

                <!-- Table -->
                <div class="overflow-x-auto">


                    <UTable v-model:sort="sort" :data="data.data?.messages" :columns="columns" :loading="pending"
                        sort-asc-icon="i-heroicons-arrow-up" sort-desc-icon="i-heroicons-arrow-down" sort-mode="manual"
                        class="w-full" @select="select">
                    </UTable>
                </div>
            </div>
            <!-- Number of rows & Pagination -->
            <template #footer>
                <div class="flex flex-col items-center justify-between gap-2 md:flex-row">
                    <div class="flex items-center gap-1.5 mb-2 sm:mb-0">
                        <span class="text-xs leading-none md:text-sm md:leading-5">{{ $ts('rows_per_page')
                        }}</span>
                        <USelect v-model="perPage" :items="perPageOptions" class="w-20 me-2" size="xs" />
                    </div>
                    <div class="mb-2 sm:mb-0">
                        <span class="text-xs leading-none md:text-sm md:leading-5">
                            {{ $ts('showing_results', { start: pageFrom, end: pageTo, total: pageTotal }) }}
                        </span>
                    </div>

                    <UPagination v-model:page="page" :items-per-page="pageTotal" :total="pageTotal"
                        :sibling-count="isMobile ? 1 : 2" show-edges />
                </div>
            </template>
        </UCard>
    </div>
</template>
<style scoped></style>