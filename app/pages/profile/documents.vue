<script setup lang='ts'>
import { ModalsConfirmation, ModalsPDF, UButton } from '#components';
import type { TableColumn } from '@nuxt/ui';
import type { IDoc } from '~~/types';
import type { IDocsMeResponse } from '~~/types/IResponse';
const UDropdownMenu = resolveComponent('UDropdownMenu');
definePageMeta({
    layout: 'dashboard'
});
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const overlay = useOverlay();
const toast = useToast();
const { $api } = useNuxtApp();

const ConfirmationModal = overlay.create(ModalsConfirmation);
const PDFModal = overlay.create(ModalsPDF);
/**
 * Pagination and sorting state
 */
const sort = ref({ column: 'createdAt', direction: 'asc' as const });
const search = ref('');
const filterBy = ref(null);
const filter = ref([]);
const pagination = ref({ pageIndex: 1, pageSize: 10 });
const { data, refresh, status } = useLazyAsyncData(() => $api<IDocsMeResponse>('/api/me/documents', {
    method: 'GET',
    query: {
        page: pagination.value.pageIndex,
        perPage: pagination.value.pageSize,
        sort: sort.value.column,
        order: sort.value.direction,
        search: search.value,
        // deleted: deleted.value
    }
}), {
    default: () => ({
        statusMessage: 'Loading...',
        statusCode: 0,
        data: {
            docs: [],
            length: 0
        }
    }),
    watch: [() => pagination.value.pageIndex, () => pagination.value.pageSize, () => sort.value.column, () => sort.value.direction]
});
const documentsMe = computed<IDoc[]>(() => data.value?.data?.docs || []);

const columns = computed<TableColumn<IDoc>[]>(() => [
    {
        id: 'no',
        label: '#',
        cell: ({ row }) => {
            return (pagination.value.pageIndex - 1) * pagination.value.pageSize + row.index + 1;
        }
    },
    {
        accessorKey: 'label',
        header: 'Label',
        cell: ({ row }) => {
            return row.getValue('label') || '-';
        }
    },
    {
        accessorKey: 'tags',
        header: 'Tag',
        cell: ({ row }) => {
            return row.original.tags?.map((tag: string) => tag).join(', ') || '-';
        }
    },
    {
        accessorKey: 'trails',
        header: 'Jejak Terakhir',
        cell: ({ row }) => {
            const lastTrail = row.original.trails?.[row.original.trails.length - 1];
            return lastTrail?.action || '-';
        }
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
const deleteModal = (id: string) => {
    ConfirmationModal.open({
        title: 'Delete Document',
        body: 'Delete Document Confirmation',
        onConfirm: async () => {
            try {
                await $api(`/api/doc`, {
                    method: 'DELETE',
                    query: { id }
                });
                toast.add({ title: 'Berhasil!', description: 'Success To Delete Document' });
                refresh();
            } catch (error: any) {
                toast.add({ title: 'Failed', description: 'Failed To Delete Document', color: 'error' });
            } finally {
                ConfirmationModal.close();
            }
        }
    });
}
const download = (doc: IDoc) => {
    const link = document.createElement('a');
    link.href = doc.doc as string;
    link.download = doc.label;
    link.click();
}

/**
 * Generate dropdown items for each row
 * @param {any} row - The row data
 * @returns {Array} Array of dropdown items
 */
const items = (row: any) => [
    [
        {
            label: 'Lihat',
            icon: 'i-heroicons-eye-20-solid',
            click: () => PDFModal.open({ doc: row })
        },
        {
            label: 'Unduh',
            icon: 'i-heroicons-arrow-down-tray-20-solid',
            click: () => download(row)
        }],
    [{
        label: 'Hapus',
        icon: 'i-heroicons-trash-20-solid',
        disabled: row.status == 'deleted',
        click: () => deleteModal(row._id)
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
const links = [{ label: 'Profil', icon: 'i-heroicons-user', to: '/profile' }, { label: 'Dokumen', icon: 'i-heroicons-archive-box' }]
</script>
<template>
    <UBreadcrumb :items="links" />
    <UCard class="p-2 mt-2 md:p-4">
        <template #header>
            <div class="flex flex-row items-center justify-between w-full p-1 md:p-2">
                <h1 class="text-lg font-semibold text-gray-600 md:text-2xl md:font-bold dark:text-gray-200">{{
                    'Dokumen' }}
                </h1>
            </div>
            <!-- Filters -->
            <div class="flex flex-col items-center justify-between gap-3 px-2 md:px-4 md:flex-row">
                <UInput v-model="search" icon="i-heroicons-magnifying-glass-20-solid" placeholder="Search..."
                    :size="responsiveUISizes.input" class="w-full md:w-auto" />
                <!-- <div class="flex flex-row w-full gap-2 md:w-auto">
                    <USelectMenu v-model="filterBy" :items="filterable" placeholder="Filter By"
                        :size="responsiveUISizes.select" class="w-full md:w-40" />
                    <USelectMenu v-model="filter" :items="data.data?.filters" multiple
                        :placeholder="filterBy?.label || 'none'" :disabled="!filterBy" :size="responsiveUISizes.select"
                        class="w-full md:w-40" />
                </div> -->
            </div>
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

                    <USelectMenu v-model="selectedColumns" :items="columns" multiple>
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
                        <USwitch v-model="deleted" id="deleted" size="xs" />
                    </div>
                    <UButton icon="i-heroicons-arrow-path" variant="ghost" :size="responsiveUISizes.button"
                        @click="refresh" :loading="pending">
                    </UButton>
                </div>
            </div> -->

            <!-- Table -->
            <div class="overflow-x-auto">


                <UTable :columns="columns" :data="documentsMe" v-model:sort="sort" v-model:pagination="pagination"
                    :loading="status === 'pending'" class="w-full">
                    <template #empty>
                        <div class="flex flex-col items-center justify-center w-full h-full p-4 text-center">
                            <UIcon name="i-heroicons-document-text" size="lg" class="text-gray-400" />
                            <p class="mt-2 text-sm font-medium text-gray-500">{{ 'No Documents Found' }}</p>
                        </div>
                    </template>
                </UTable>
            </div>
        </div>
        <!-- Number of rows & Pagination -->
        <template #footer>
            <div class="flex flex-col items-center justify-between gap-2 md:flex-row">
                <div class="flex items-center gap-1.5 mb-2 sm:mb-0">
                    <span class="text-xs leading-none md:text-sm md:leading-5">{{ 'Baris per Halaman' }}</span>
                    <USelect v-model="pagination.pageSize" :items="perPageOptions" class="w-20 me-2" size="xs" />
                </div>
                <div class="mb-2 sm:mb-0">
                    <span class="text-xs leading-none md:text-sm md:leading-5">
                        {{ 'Menampilkan {start} hingga {end} dari {total} hasil' /* params: { start: pageFrom, end: pageTo, total: pageTotal } */ }}
                    </span>
                </div>
                <UPagination v-model:page="pagination.pageIndex" :items-per-page="pagination.pageSize"
                    :total="pageTotal" :sibling-count="isMobile ? 2 : 6" />
            </div>
        </template>
    </UCard>

</template>
<style scoped></style>