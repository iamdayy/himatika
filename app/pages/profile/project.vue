<script setup lang='ts'>
import { UButton } from '#components';
import type { TableColumn } from '@nuxt/ui';
import type { IProject } from '~~/types';
import type { IProjectMeResponse } from '~~/types/IResponse';

const UDropdownMenu = resolveComponent('UDropdownMenu');

definePageMeta({
    layout: 'dashboard'
});
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const { $api } = useNuxtApp();
const { $ts } = useI18n()
const { data, refresh, status } = useLazyAsyncData(() => $api<IProjectMeResponse>('/api/me/project'))
const projectsMe = computed<IProject[]>(() => data.value?.data?.projects || []);

/**
 * Pagination and sorting state
 */
const sort = ref({ column: 'createdAt', direction: 'asc' as const });
const pagination = ref({ pageIndex: 1, pageSize: 10 });

const columns = computed<TableColumn<IProject>[]>(() => [
    {
        id: 'no',
        label: '#',
        cell: ({ row }) => {
            return (pagination.value.pageIndex - 1) * pagination.value.pageSize + row.index + 1;
        }
    },
    {
        accessorKey: 'title',
        header: $ts('title'),
        cell: ({ row }) => {
            return row.getValue('title');
        },
        size: 200,
    },
    {
        accessorKey: 'category.title',
        header: $ts('category'),
        cell: ({ row }) => {
            return row.getValue('category.title');
        },
        size: 150,
    },
    {
        accessorKey: 'createdAt',
        header: $ts('date'),
        cell: ({ row }) => {
            return new Date(row.getValue('createdAt')).toLocaleDateString('id-ID', { dateStyle: 'long' });
        },
        size: 150,
    },
    {
        accessorKey: 'progress',
        header: $ts('progress'),
        cell: ({ row }) => {
            return row.getValue('progress');
        },
        size: 150,
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
])
const selectedRows = ref<{
    [key: number]: boolean;
}>({});

/**
 * Computed properties for pagination
 */
const pageTotal = computed(() => data.value?.data?.length || 0);
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
 * Generate dropdown items for each row
 * @param {any} row - The row data
 * @returns {Array} Array of dropdown items
 */
const items = (row: any) => [
    [{
        label: 'Edit',
        icon: 'i-heroicons-pencil-square-20-solid',
        // click: () => editModal(row.NIM)
    }],
    [{
        label: 'Delete',
        icon: 'i-heroicons-trash-20-solid',
        disabled: row.status == 'deleted',
        // click: () => deleteModal(row.NIM)
    }]
];

/**
 * Responsive UI sizes based on screen width
 */
const responsiveUISizes = computed<{ [key: string]: 'xs' | 'md' }>(() => ({
    input: isMobile.value ? 'xs' : 'md',
    button: isMobile.value ? 'xs' : 'md',
    select: isMobile.value ? 'xs' : 'md',
}));
const links = [{ label: $ts('profile'), icon: 'i-heroicons-user', to: '/profile' }, { label: $ts('project'), icon: 'i-heroicons-code-bracket' }]
</script>
<template>
    <UBreadcrumb :items="links" />
    <UCard class="p-2 mt-2 md:p-4">
        <template #header>
            <div class="flex flex-row items-center justify-between w-full p-1 md:p-2">
                <h1 class="text-lg font-semibold text-gray-600 md:text-2xl md:font-bold dark:text-gray-200">
                    {{ $ts('project') }}
                </h1>
            </div>
            <!-- Filters -->
            <!-- <div class="flex flex-col items-center justify-between gap-3 px-2 md:px-4 md:flex-row">
                <UInput v-model="search" icon="i-heroicons-magnifying-glass-20-solid" placeholder="Search..."
                    :size="responsiveUISizes.input" class="w-full md:w-auto" />
                <div class="flex flex-row w-full gap-2 md:w-auto">
                    <USelectMenu v-model="filterBy" :options="filterable" placeholder="Filter By"
                        :size="responsiveUISizes.select" class="w-full md:w-40" />
                    <USelectMenu v-model="filter" :options="data.data?.filters" multiple
                        :placeholder="filterBy?.label || 'none'" :disabled="!filterBy" :size="responsiveUISizes.select"
                        class="w-full md:w-40" />
                </div>
            </div> -->
        </template>
        <div class="w-full">

            <!-- Header and Action buttons -->
            <!-- <div class="flex-row items-center justify-between hidden w-full gap-2 px-2 md:px-4 md:flex">
                <div class="flex items-center gap-1.5">
                    <UButton v-if="selectedRows.length > 1" icon="i-heroicons-arrow-down-tray" trailing color="gray"
                        :size="responsiveUISizes.button" @click="generateXlsx">
                        Export Selected
                    </UButton>
                    <UButton v-else icon="i-heroicons-arrow-down-tray" trailing color="gray"
                        :size="responsiveUISizes.button" @click="generateXlsx">
                        Export All
                    </UButton>
                </div>

                <div class="flex flex-wrap gap-1.5 items-center justify-center md:justify-end">

                    <USelectMenu v-model="selectedColumns" :options="columns" multiple>
                        <UButton icon="i-heroicons-view-columns" color="gray" :size="responsiveUISizes.button">
                            Columns
                        </UButton>
                    </USelectMenu>

                    <UButton icon="i-heroicons-funnel" color="gray" :size="responsiveUISizes.button"
                        :disabled="search === '' && filter.length === 0" @click="resetFilters">
                        Reset
                    </UButton>
                    <div class="flex flex-col items-center gap-2">
                        <label class="text-xs font-light text-gray-600 dark:text-gray-400" for="deleted">Show
                            deleted</label>
                        <UToggle v-model="deleted" id="deleted" size="xs" />
                    </div>
                    <UButton icon="i-heroicons-arrow-path" variant="ghost" :size="responsiveUISizes.button"
                        @click="refresh" :loading="pending">
                    </UButton>
                </div>
            </div> -->

            <!-- Table -->
            <div class="overflow-x-auto">


                <UTable :columns="columns" :data="projectsMe">
                </UTable>
            </div>
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

</template>
<style scoped></style>