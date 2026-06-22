<script setup lang='ts'>
import { ModalsConfirmation } from '#components';
import type { TableColumn } from '@nuxt/ui';
import type { IMessage } from '~~/types';
import type { IMessageResponse } from '~~/types/IResponse';

const UDropdownMenu = resolveComponent('UDropdownMenu');
const UButton = resolveComponent('UButton');
const UBadge = resolveComponent('UBadge');
const UAvatar = resolveComponent('UAvatar');
const UIcon = resolveComponent('UIcon');


type responsive = {
    [key: string]: 'xs' | 'md' | 'lg' | 'sm';
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
    input: isMobile.value ? 'sm' : 'md',
    button: isMobile.value ? 'sm' : 'md',
    select: isMobile.value ? 'sm' : 'md',
}));

/**
 * Slideover State for viewing messages
 */
const isSlideoverOpen = ref(false);
const selectedMessage = ref<(IMessage & { _id: string, createdAt?: Date }) | null>(null);

function viewMessage(row: any) {
    selectedMessage.value = row;
    isSlideoverOpen.value = true;
}

/**
 * Selected rows management
 */
const selectedRows = ref<any[]>([]);

/**
 * Search and filter state
 */
const search = ref('');
const deleted = ref<boolean>(false);

/**
 * Reset all filters
 */
const resetFilters = () => {
    search.value = '';
    deleted.value = false;
};

/**
 * Pagination and sorting state
 */
const sort = ref({ column: 'createdAt', direction: 'desc' as const });
const page = ref(1);
const perPage = ref(10);

/**
 * Fetch data from API
 */
const { data, pending, refresh } = useLazyAsyncData('messages', () => $api<IMessageResponse>('/api/message', {
    query: {
        search: search.value,
        page: page.value,
        perPage: perPage.value,
        sort: sort.value.column,
        order: sort.value.direction,
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
    watch: [page, search, perPage, sort, deleted]
});

/**
 * Computed properties for pagination
 */
const pageTotal = computed(() => data.value.data?.length || 0);
const pageFrom = computed(() => pageTotal.value === 0 ? 0 : (page.value - 1) * perPage.value + 1);
const pageTo = computed(() => Math.min(page.value * perPage.value, pageTotal.value));
const perPageOptions = computed(() => {
    const baseOptions = [5, 10, 20, 50, 100];
    const filteredOptions = baseOptions.filter((option) => option <= Math.max(pageTotal.value, 10));

    if (isMobile.value && filteredOptions.length > 3) {
        return filteredOptions.slice(0, 3);
    }
    return filteredOptions.length > 0 ? filteredOptions : baseOptions;
});


/**
 * Table columns configuration
 */
const columns = computed<TableColumn<IMessage>[]>(() => [
    {
        accessorKey: 'from',
        header: $ts('from'),
        size: 250,
        cell: ({ row }) => {
            const name = `${row.original.name?.first || ''} ${row.original.name?.last || ''}`.trim() || 'Anonymous';
            return h('div', { class: 'flex items-center gap-3 cursor-pointer group', onClick: () => viewMessage(row.original) }, [
                h(UAvatar, {
                    alt: name,
                    size: 'sm',
                    ui: { background: 'bg-primary-100 dark:bg-primary-900/50', text: 'text-primary-600 dark:text-primary-300' }
                }),
                h('div', { class: 'flex flex-col' }, [
                    h('span', { class: 'font-semibold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors' }, name),
                    h('span', { class: 'text-xs text-gray-500' }, row.original.email)
                ])
            ]);
        },
    },
    {
        accessorKey: 'subject',
        header: $ts('subject'),
        size: 300,
        cell: ({ row }) => {
            return h('div', { class: 'cursor-pointer group flex flex-col justify-center', onClick: () => viewMessage(row.original) }, [
                h('p', { class: 'font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[200px] md:max-w-[300px] group-hover:text-primary-500 transition-colors' }, row.original.subject || 'No Subject'),
                h('p', { class: 'text-xs text-gray-500 truncate max-w-[200px] md:max-w-[300px] mt-0.5' }, row.original.message || '')
            ])
        },
    },
    {
        accessorKey: 'status',
        header: $ts('status'),
        size: 100,
        cell: ({ row }) => {
            const isArchived = row.original.archived;
            return h('div', { onClick: () => viewMessage(row.original), class: 'cursor-pointer w-fit' }, [
                h(UBadge, {
                    color: isArchived ? 'neutral' : 'primary',
                    variant: isArchived ? 'soft' : 'subtle',
                    size: 'xs',
                    class: 'rounded-full px-2.5'
                }, () => isArchived ? $ts('archived') : $ts('active'))
            ]);
        },
    },
    {
        id: 'actions',
        header: '',
        size: 50,
        cell: ({ row }) => {
            return h('div', { class: 'text-right' }, [
                h(UDropdownMenu, {
                    items: items(row.original)
                }, () => h(UButton, { color: 'gray', variant: 'ghost', icon: 'i-heroicons-ellipsis-vertical-20-solid' }))
            ])
        },
    }
]);


/**
 * Delete a message
 */
const deleteMessage = async (id: string) => {
    try {
        const deleted = await $api('/api/message', {
            method: 'delete',
            query: { id }
        });
        toast.add({ title: deleted.statusMessage, color: 'success' });
    } catch (error: any) {
        toast.add({ title: error.statusMessage, color: 'error' });
    }
};

const archiveMessage = async (id: string) => {
    try {
        const archived = await $api('/api/message/archive', {
            method: 'post',
            query: { id }
        });
        toast.add({ title: archived.statusMessage, color: 'success' });
    } catch (error: any) {
        toast.add({ title: error.statusMessage, color: 'error' });
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
        link.setAttribute('download', `${title}-${new Date().getTime()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error generating Excel file:', error);
        toast.add({ title: 'Failed to export Excel', color: 'error' });
    }
};

/**
 * Watch for changes in search to reset page
 */
watch([search, deleted], () => {
    page.value = 1;
});

/**
 * Open delete confirmation modal
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
 */
const items = (row: any) => [
    [
        {
            label: 'View Details',
            icon: 'i-heroicons-eye-20-solid',
            click: () => viewMessage(row)
        }
    ],
    [
        {
            label: row.archived ? 'Unarchive' : $ts('archive'),
            icon: 'i-heroicons-archive-box-arrow-down-20-solid',
            click: () => archiveModal(row._id)
        },
        {
            label: $ts('delete'),
            icon: 'i-heroicons-trash-20-solid',
            disabled: row.deleted,
            class: 'text-red-500 dark:text-red-400',
            click: () => deleteModal(row._id)
        }
    ]
];

const exportDropdownItems = computed(() => [
    [
        {
            label: 'Export Selected',
            icon: 'i-heroicons-document-check',
            disabled: selectedRows.value.length === 0,
            click: () => generateXlsx()
        },
        {
            label: 'Export All',
            icon: 'i-heroicons-document-arrow-down',
            click: () => {
                selectedRows.value = [];
                generateXlsx();
            }
        }
    ]
]);

const links = computed(() => [{
    label: $ts('dashboard'),
    icon: 'i-heroicons-home',
    to: '/dashboard'
}, {
    label: $ts('messages'),
    icon: 'i-heroicons-inbox',
}]);

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
    title: () => $ts('messages')
});
</script>

<template>
    <div class="mb-24">
        <!-- Header Section -->
        <div class="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
            <div>
                <UBreadcrumb :items="links" class="mb-3" />
                <div class="flex items-center gap-3">
                    <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                        {{ $ts('messages') }}
                    </h1>
                    <UBadge v-if="pageTotal > 0" color="primary" variant="subtle" size="md" class="rounded-full px-2.5">
                        {{ pageTotal }}
                    </UBadge>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and respond to user inquiries.</p>
            </div>

            <!-- Global Actions -->
            <div class="flex items-center gap-2">
                <UButton icon="i-heroicons-arrow-path" color="gray" variant="ghost" @click="refresh()"
                    :loading="pending" />
                <UDropdownMenu :items="exportDropdownItems" :modal="false">
                    <UButton icon="i-heroicons-arrow-down-tray" color="neutral" variant="outline"
                        trailing-icon="i-heroicons-chevron-down-20-solid">
                        Export
                    </UButton>
                </UDropdownMenu>
            </div>
        </div>

        <!-- Main Card -->
        <UCard :ui="{
            root: 'overflow-hidden transition-all duration-300 ring-1 ring-gray-200 dark:ring-gray-800 shadow-sm hover:shadow-md',
            header: 'p-0 sm:p-0',
            body: 'p-0 sm:p-0'
        }">

            <!-- Filters Toolbar -->
            <div
                class="border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                <div class="w-full sm:w-72">
                    <UInput v-model="search" icon="i-heroicons-magnifying-glass-20-solid"
                        placeholder="Search subject or sender..." :size="responsiveUISizes.input" />
                </div>

                <div class="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div
                        class="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <UIcon name="i-heroicons-trash-20-solid" class="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Show deleted</span>
                        <USwitch v-model="deleted" size="sm" color="error" class="ml-1" />
                    </div>
                </div>
            </div>

            <!-- Table -->
            <div class="overflow-x-auto relative min-h-[300px]">
                <UTable v-model="selectedRows" v-model:sort="sort" :data="data.data?.messages" :columns="columns"
                    :loading="pending" sort-asc-icon="i-heroicons-arrow-up" sort-desc-icon="i-heroicons-arrow-down"
                    sort-mode="manual" class="w-full" :ui="{
                        tr: 'hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors',
                        td: 'py-3.5'
                    }">
                    <template #empty-state>
                        <div class="flex flex-col items-center justify-center py-16 text-center">
                            <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4 shadow-inner">
                                <UIcon name="i-heroicons-inbox-20-solid"
                                    class="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <p class="text-gray-900 dark:text-white font-semibold text-lg">No messages found</p>
                            <p class="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-sm">
                                Your inbox is clean. Try adjusting your search filters if you're looking for something
                                specific.
                            </p>
                        </div>
                    </template>
                </UTable>
            </div>

            <!-- Footer Pagination -->
            <div
                class="border-t border-gray-200 dark:border-gray-800 px-4 py-3 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col md:flex-row items-center justify-between gap-3">
                <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span class="font-medium">Rows:</span>
                    <USelect v-model="perPage" :items="perPageOptions" size="xs" color="neutral" variant="outline"
                        class="w-20" />
                    <span class="hidden sm:inline ml-2">
                        Showing <span class="font-medium text-gray-900 dark:text-gray-200">{{ pageFrom }}</span> to
                        <span class="font-medium text-gray-900 dark:text-gray-200">{{ pageTo }}</span> of <span
                            class="font-medium text-gray-900 dark:text-gray-200">{{ pageTotal }}</span>
                    </span>
                </div>

                <UPagination v-model:page="page" :items-per-page="perPage" :total="pageTotal"
                    :sibling-count="isMobile ? 1 : 2" show-edges />
            </div>
        </UCard>

        <!-- Slideover for Message Details -->
        <USlideover v-model="isSlideoverOpen" prevent-close class="z-50">
            <UCard class="flex flex-col flex-1 h-full shadow-2xl ring-0 divide-y-0"
                :ui="{ body: 'flex-1 overflow-y-auto px-6 py-6', header: 'bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 px-6 py-4', footer: 'bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800 px-6 py-4' }">
                <template #header>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div
                                class="p-1.5 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 rounded-lg">
                                <UIcon name="i-heroicons-envelope-open-20-solid" class="w-5 h-5" />
                            </div>
                            <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                                Message Details
                            </h3>
                        </div>
                        <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1"
                            @click="isSlideoverOpen = false" />
                    </div>
                </template>

                <div v-if="selectedMessage" class="space-y-6">
                    <!-- Sender Info -->
                    <div
                        class="flex items-start justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm">
                        <div class="flex gap-4 items-center">
                            <UAvatar
                                :alt="`${selectedMessage.name?.first || ''} ${selectedMessage.name?.last || ''}`.trim() || 'Anonymous'"
                                size="lg" class="ring-2 ring-gray-100 dark:ring-gray-800"
                                :ui="{ background: 'bg-primary-100 dark:bg-primary-900/50', text: 'text-primary-600 dark:text-primary-300 font-bold' }" />
                            <div>
                                <h4 class="font-bold text-gray-900 dark:text-white text-lg leading-tight">
                                    {{ `${selectedMessage.name?.first || ''} ${selectedMessage.name?.last || ''}`.trim()
                                        ||
                                        'Anonymous' }}
                                </h4>
                                <div class="flex flex-col gap-1.5 mt-2">
                                    <a :href="`mailto:${selectedMessage.email}`"
                                        class="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium flex items-center gap-1.5 transition-colors">
                                        <UIcon name="i-heroicons-envelope-20-solid" class="w-4 h-4" />
                                        {{ selectedMessage.email }}
                                    </a>
                                    <a v-if="selectedMessage.phone" :href="`tel:${selectedMessage.phone}`"
                                        class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium flex items-center gap-1.5 transition-colors">
                                        <UIcon name="i-heroicons-phone-20-solid" class="w-4 h-4" />
                                        {{ selectedMessage.phone }}
                                    </a>
                                </div>
                            </div>
                        </div>
                        <UBadge :color="selectedMessage.archived ? 'neutral' : 'success'"
                            :variant="selectedMessage.archived ? 'soft' : 'subtle'" size="md" class="rounded-full">
                            {{ selectedMessage.archived ? 'Archived' : 'Active' }}
                        </UBadge>
                    </div>

                    <!-- Message Content -->
                    <div class="space-y-4">
                        <div>
                            <h5
                                class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                Subject</h5>
                            <p class="text-gray-900 dark:text-white font-bold text-xl">{{ selectedMessage.subject || 'No Subject' }}</p>
                        </div>

                        <div
                            class="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-5 border border-gray-100 dark:border-gray-800/80 shadow-inner">
                            <h5
                                class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <UIcon name="i-heroicons-document-text-20-solid" class="w-4 h-4" />
                                Content
                            </h5>
                            <div class="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed text-base">
                                {{
                                    selectedMessage.message }}</div>
                        </div>
                    </div>

                    <!-- Tags -->
                    <div v-if="selectedMessage.tags && selectedMessage.tags.length > 0">
                        <h5 class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Tags</h5>
                        <div class="flex flex-wrap gap-2">
                            <UBadge v-for="tag in selectedMessage.tags" :key="tag" color="gray" variant="soft"
                                class="rounded-full font-medium">
                                {{ tag }}
                            </UBadge>
                        </div>
                    </div>
                </div>

                <template #footer v-if="selectedMessage">
                    <div class="flex justify-between gap-3 w-full">
                        <UButton color="error" variant="soft" icon="i-heroicons-trash-20-solid"
                            @click="deleteModal(selectedMessage._id); isSlideoverOpen = false">
                            Delete
                        </UButton>
                        <div class="flex gap-2">
                            <UButton :color="selectedMessage.archived ? 'primary' : 'neutral'" variant="soft"
                                :icon="selectedMessage.archived ? 'i-heroicons-archive-box-arrow-up-20-solid' : 'i-heroicons-archive-box-arrow-down-20-solid'"
                                @click="archiveModal(selectedMessage._id); isSlideoverOpen = false">
                                {{ selectedMessage.archived ? 'Unarchive' : 'Archive' }}
                            </UButton>
                            <UButton color="primary" icon="i-heroicons-paper-airplane-20-solid"
                                :to="`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`"
                                target="_blank">
                                Reply
                            </UButton>
                        </div>
                    </div>
                </template>
            </UCard>
        </USlideover>
    </div>
</template>

<style scoped></style>