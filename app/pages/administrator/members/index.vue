<script setup lang='ts'>
import { ModalsConfirmation, ModalsMemberAdd, ModalsMemberEdit, UBadge, UButton, UCheckbox } from '#components';
import type { TableColumn } from '@nuxt/ui';
import type { Column } from '@tanstack/vue-table';
import type { IMember } from '~~/types';
import type { IMemberResponse } from '~~/types/IResponse';
const UDropdownMenu = resolveComponent('UDropdownMenu');
const NuxtImg = resolveComponent('NuxtImg');
/**
 * Page metadata configuration
 */
definePageMeta({
    layout: 'dashboard',
    middleware: ['sidebase-auth', 'organizer']
});

/**
 * Set page title
 */
useHead({
    title: () => `${useI18n().t('member')}`
});

const { $api } = useNuxtApp();

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
const { $ts } = useI18n();

const ConfirmationModal = overlay.create(ModalsConfirmation);
const AddMemberModal = overlay.create(ModalsMemberAdd);
const EditMemberModal = overlay.create(ModalsMemberEdit);

const table = useTemplateRef('table')
const router = useRouter();

/**
 * Responsive design
 */
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 640);

/**
 * Responsive UI sizes based on screen width
 */
const responsiveUISizes = computed<{ [key: string]: 'xs' | 'md' }>(() => ({
    input: isMobile.value ? 'xs' : 'md',
    button: isMobile.value ? 'xs' : 'md',
    select: isMobile.value ? 'xs' : 'md',
    badge: isMobile.value ? 'xs' : 'md',
}));
function addPinButton(column: Column<IMember>, label: string, position: 'left' | 'right') {
    const isPinned = column.getIsPinned()

    return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label,
        icon: isPinned ? 'i-lucide-pin-off' : 'i-lucide-pin',
        class: '-mx-2.5',
        onClick() {
            column.pin(isPinned === position ? false : position)
        }
    })
}
function addSortButton(column: Column<IMember>, label: string) {
    const isSorted = column.getIsSorted();

    return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: label,
        icon: isSorted
            ? isSorted === 'asc'
                ? 'i-lucide-arrow-up-narrow-wide'
                : 'i-lucide-arrow-down-wide-narrow'
            : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => {
            sort.value.column = column.id;
            sort.value.direction = column.getIsSorted() === 'asc' ? 'desc' : 'asc';
            column.toggleSorting(column.getIsSorted() === 'asc');
        }
    })
}
/**
 * Table columns configuration
 */
const columns = computed<TableColumn<IMember>[]>(() => [
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
                size: responsiveUISizes.value.input,
                'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
                'aria-label': 'Select row'
            })
    },
    {
        accessorKey: 'id',
        header: '#',
        size: 50,
        enableSorting: false,
        enableResizing: false,
        cell: ({ row }) => row.index + 1,
        // footer: ({ table }) => table.getPageCount() * table.ge,
    },
    {
        accessorKey: 'fullName',
        header: ({ column }) => addPinButton(column, $ts('name'), 'left'),
        size: 150,
        cell: ({ row }) => {
            return h('div', {
                class: 'flex flex-row items-center gap-2',
            }, [
                h(NuxtImg, {
                    provider: 'localProvider',
                    src: row.original.avatar as string || '/img/profile-blank.png',
                    class: 'object-cover rounded-full max-w-12 aspect-square',
                    alt: row.original.fullName,
                    loading: 'lazy'
                }),
                h('div', {
                    class: 'flex flex-col items-start gap-1',
                }, [
                    h('span', {
                        class: 'font-semibold text-gray-600 dark:text-gray-200'
                    }, row.getValue('fullName')),
                    h('span', {
                        class: 'text-sm font-light text-gray-600 dark:text-gray-300'
                    }, `${row.original.NIM} | ${row.original.email}`),
                ]),
            ]);
        }
    },
    {
        accessorKey: 'class',
        header: ({ column }) => addSortButton(column, $ts('class')),
        size: 100,
    },
    {
        accessorKey: 'semester',
        header: ({ column }) => addSortButton(column, $ts('semester')),
        size: 100,
    },
    {
        accessorKey: 'position',
        header: $ts('job'),
        size: 100,
        cell: ({ row }) => {
            return h('div', {
                class: 'flex flex-col items-start gap-2',
            }, row.original.organizer ? [
                h(UBadge, {
                    color: 'success',
                    size: responsiveUISizes.value.badge,
                    variant: 'solid',
                    label: row.original.organizer.role.charAt(0).toUpperCase() + row.original.organizer.role.slice(1)

                }),
                h('span', {
                    class: 'text-xs md:text-md md:font-semibold text-gray-600 dark:text-gray-200'
                }, `${new Date(row.original.organizer.period.start).getFullYear()} - ${new Date(row.original.organizer.period.end).getFullYear()}`)
            ] : [
                h(UBadge, {
                    color: 'neutral',
                    size: responsiveUISizes.value.badge,
                    variant: 'solid',
                    label: $ts('member')
                })
            ]);
        }
    },
    {
        accessorKey: 'point',
        header: ({ column }) => addSortButton(column, $ts('point')),
        size: 100,
        cell: ({ row }) => {
            if (!row.original.point || row.original.point.length === 0) {
                return h('span', {
                    class: 'text-sm font-semibold text-gray-600 dark:text-gray-200'
                }, '0');
            }
            return h('span', {
                class: 'text-sm font-semibold text-gray-600 dark:text-gray-200'
            }, (row.original.point?.find?.(p => p.semester === row.original.semester)?.point ??
                row.original.point?.[0]?.point ??
                '0'));
        }
    },
    {
        accessorKey: 'enteredYear',
        header: ({ column }) => addSortButton(column, $ts('generation')),
        size: 100,
    },
    {
        accessorKey: 'status',
        header: $ts('status'),
        size: 100,
        cell: ({ row }) => {
            if (!row.original.status) {
                return h('span', {
                    class: 'text-xs font-light text-gray-600 dark:text-gray-400'
                }, 'N/A');
            }
            return h(UBadge, {
                color: colorbadge(row.original.status),
                size: responsiveUISizes.value.badge,
                variant: 'solid',
                label: row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)
            });
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
]);

const columnVisibility = ref({
    id: false
})


/**
 * Selected rows management
 */
const selectedRows = ref<{
    [key: number]: boolean;
}>({});
const columnPinning = ref({
    left: ['select'],
    right: ['']
})

const selectedMember = computed(() => {
    return data.value.data?.members?.filter((row: IMember, index) => {
        return selectedRows.value[index] !== undefined && selectedRows.value[index] !== null;
    }) || [];
});


/**
 * Filterable options for the table
 */
const filterable = [
    { key: 'class', label: $ts('class'), value: "class" },
    { key: 'semester', label: $ts('semester'), value: "semester" },
    { key: 'status', label: $ts('status'), value: "status" },
];

/**
 * Search and filter state
 */
const search = ref('');
const NIM = ref(undefined);
const filterBy = ref<"enteredYear" | "class" | "semester">();
const filter = ref<string[]>([]);
const deleted = ref<boolean>(false);

/**
 * Reset all filters
 */
const resetFilters = () => {
    search.value = '';
    filter.value = [];
    filterBy.value = undefined;
};

/**
 * Pagination and sorting state
 */
const sort = ref<{ column: string; direction: 'asc' | 'desc' }>({ column: 'createdAt', direction: 'asc' as const });
const pagination = ref({
    pageIndex: 1,
    pageSize: 10,
})

/**
 * Fetch data from API
 */
const { data, pending, refresh } = await useLazyAsyncData('users', () => $api<IMemberResponse>('/api/member', {
    query: {
        search: search.value,
        page: pagination.value.pageIndex,
        perPage: pagination.value.pageSize,
        sort: sort.value.column,
        order: sort.value.direction,
        filterBy: filterBy.value,
        filter: filter.value,
        deleted: deleted.value,
        NIM: NIM.value
    }
}), {
    default: () => ({
        data: {
            members: [],
            filters: [],
            length: 0
        }
    }),
    watch: [() => pagination.value.pageIndex, search, () => pagination.value.pageSize, () => sort.value.column, () => sort.value.direction, filter, filterBy, deleted, NIM],
});

const filters = computed(() => {
    const rawFilters = data.value.data?.filters || [];
    return rawFilters.filter(filter => filter != null && filter !== 0 && filter !== "" && filter !== undefined).map(filter => filter.toString());
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
 * Delete a member
 * @param {number} NIM - The NIM of the member to delete
 */
const deleteMember = async (NIM: number) => {
    try {
        const deleted = await $api('/api/member', {
            method: 'delete',
            query: { NIM }
        });
        toast.add({ title: $ts('success'), description: $ts('success_to_delete_member'), color: 'success' });
    } catch (error: any) {
        toast.add({ title: $ts('failed'), description: $ts('failed_to_delete_member'), color: 'error' });
    }
};

/**
 * Generate Excel file for export
 */
const generateXlsx = async () => {
    try {
        let toExcel = selectedMember.value;
        if (selectedMember.value.length == 0) {
            toExcel = (await $api<IMemberResponse>('/api/member')).data?.members as IMember[];
        }
        const response = await $api('/api/member/sheet/export', {
            method: "post",
            responseType: 'blob',
            body: {
                data: toExcel.map(member => member.NIM)
            }
        });

        // download file
        const blob = new Blob([response as BlobPart], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'members.xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {

        console.error('Error generating Excel file:', error);
    }
};

const updateSemester = async () => {
    ConfirmationModal.open({
        title: $ts('confirmation'),
        body: $ts('confirmation_update_semester'),
        async onConfirm() {
            try {
                const response = await $api('/api/member/semester', {
                    method: 'put',
                });
                toast.add({ title: response.statusMessage });
            } catch (error: any) {
                toast.add({ title: error.statusMessage, color: 'error' });
            }
        }
    });
}
/**
 * Watch for changes in search and filter to reset page
 */
watch([search, filter], () => {
    pagination.value.pageIndex = 1;
});

/**
 * Open add modal
 */
const addModal = () => {
    AddMemberModal.open({
        onTriggerRefresh() {
            refresh();
            AddMemberModal.close(); 5
        }
    });
};

/**
 * Open edit modal
 * @param {number} NIM - The NIM of the member to edit
 */
const editModal = (NIM: number) => {
    EditMemberModal.open({ NIM });
};

/**
 * Open delete confirmation modal
 * @param {number} NIM - The NIM of the member to delete
 */
const deleteModal = (NIM: number) => {
    ConfirmationModal.open({
        title: $ts('confirmation'),
        body: $ts('confirmation_delete_member', { NIM }),
        onConfirm() {
            deleteMember(NIM).then(() => { ConfirmationModal.close(); refresh(); });
        }
    });
};

/**
 * Generate dropdown items for each row
 * @param {any} row - The row data
 * @returns {Array} Array of dropdown items
 */
const items = (row: any) => [
    [{
        label: $ts('edit'),
        icon: 'i-heroicons-pencil-square-20-solid',
        onSelect: () => editModal(row.NIM)
    },
    {
        label: $ts('open'),
        icon: 'i-heroicons-eye-20-solid',
        onSelect: () => router.push(`/profile/${row.NIM}`),
    }
    ],
    [{
        label: $ts('delete'),
        icon: 'i-heroicons-trash-20-solid',
        disabled: row.status == 'deleted',
        onSelect: () => deleteModal(row.NIM)
    }]
];

/**
 * Get color for status badge
 * @param {string} status - The status of the user
 * @returns {string} Color for the badge
 */
const colorbadge = (status: "active" | "inactive" | "free" | "deleted"): "success" | "warning" | "secondary" | "error" | "neutral" => {
    switch (status) {
        case "active": return "success";
        case "inactive": return "warning";
        case "free": return "secondary";
        case "deleted": return "error";
        default: return "neutral";
    }
};
const fieldsToUpdate = computed(() => [
    { label: $ts('status'), value: 'status' },
    { label: $ts('class'), value: 'class' },
    { label: $ts('semester'), value: 'semester' },
    { label: $ts('generation'), value: 'enteredYear' }
]);
const selectedFieldToUpdate = ref<string>('status');
const valueToUpdate = ref<string | number>('');
const batchUpdate = async () => {
    if (selectedMember.value.length === 0) {
        toast.add({ title: $ts('no_member_selected'), color: 'warning' });
        return;
    }
    const field = selectedFieldToUpdate.value;
    const value = valueToUpdate.value;
    if (!value) return;

    try {
        await $api('/api/member/batch', {
            method: 'put',
            body: {
                members: selectedMember.value.map(member => member.NIM),
                field,
                value
            }
        });
        toast.add({ title: $ts('success'), description: $ts('success_to_update_member'), color: 'success' });
        refresh();
    } catch (error: any) {
        toast.add({ title: $ts('failed'), description: error.statusMessage, color: 'error' });
    }
};
const links = computed(() => [{
    label: $ts('dashboard'),
    icon: 'i-heroicons-home',
    to: '/dashboard'
}, {
    label: $ts('member'),
    icon: 'i-heroicons-users',
}]);
</script>
<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :items="links" />
        <UCard class="p-2 mt-2 md:p-4">
            <template #header>
                <div class="flex flex-row items-center justify-between w-full p-1 md:p-2">
                    <h1 class="text-lg font-semibold text-gray-600 md:text-2xl md:font-bold dark:text-gray-200">{{
                        $ts('member') }} </h1>
                    <h1 class="text-sm font-light text-gray-500 md:text-base dark:text-gray-400">
                        {{ $ts('total_members', { count: pageTotal }) }}
                    </h1>
                    <div class="flex flex-row items-center gap-2">
                        <UButton :label="$ts('add')" :size="responsiveUISizes.button" v-if="isOrganizer"
                            class="mx-auto my-3" @click="addModal" />
                        <UButton :label="$ts('import')" :size="responsiveUISizes.button" class="mx-auto my-3"
                            v-if="isOrganizer" to="/administrator/members/import" />
                    </div>
                </div>
                <!-- Filters -->
                <div class="flex flex-col items-center justify-between gap-3 px-2 md:px-4 md:flex-row">
                    <div class="flex flex-row items-center gap-3">
                        <UInput v-model="NIM" :placeholder="$ts('search_placeholder', { key: 'NIM' })"
                            @keyup.enter="refresh()" :loading="pending" :size="responsiveUISizes.input"
                            class="hidden w-full md:w-auto md:block">
                            <template #trailing>
                                <UButton class="text-xs text-gray-500 dark:text-gray-400" color="neutral" variant="link"
                                    @click="refresh()" icon="i-heroicons-magnifying-glass-20-solid"></UButton>
                            </template>
                        </UInput>
                        <UInput v-model="search" icon="i-heroicons-magnifying-glass-20-solid" @keyup.enter="refresh()"
                            :loading="pending" :loading-icon="pending ? 'i-heroicons-arrow-path' : undefined"
                            :size="responsiveUISizes.input" class="w-full md:w-auto" />
                    </div>
                    <div class="flex flex-row w-full gap-2 md:w-auto">
                        <USelectMenu v-model="filterBy" :items="filterable" :placeholder="$ts('filter_by')"
                            :loading="pending" :size="responsiveUISizes.select" class="w-full md:w-40" value-key="value"
                            label-key="label" />
                        <USelectMenu v-model="filter" :items="filters" multiple :placeholder="$ts('filter')"
                            :loading="pending" :disabled="!filterBy" :size="responsiveUISizes.select"
                            class="w-full md:w-40" />

                        <UButton icon="i-heroicons-funnel" color="neutral" variant="outline"
                            :size="responsiveUISizes.button"
                            :disabled="search === '' && NIM === '' && filter.length === 0" @click="resetFilters">
                            Reset
                        </UButton>
                    </div>
                </div>
            </template>
            <div class="w-full space-y-2 md:space-y-4">

                <!-- Header and Action buttons -->
                <div class="flex-row items-center justify-between hidden w-full gap-2 px-2 md:px-4 md:flex">
                    <div class="flex items-center gap-1.5">
                        <UButton icon="i-heroicons-chevron-double-up" trailing color="neutral" variant="outline"
                            :size="responsiveUISizes.button" @click="updateSemester" v-if="isOrganizer">
                            {{ $ts('update_semester') }}
                        </UButton>
                        <UButton v-if="selectedMember.length > 1" icon="i-heroicons-arrow-down-tray" trailing
                            variant="outline" color="neutral" :size="responsiveUISizes.button" @click="generateXlsx">
                            {{ $ts('export_selected') }}
                        </UButton>
                        <UButton v-else icon="i-heroicons-arrow-down-tray" trailing color="neutral" variant="outline"
                            :size="responsiveUISizes.button" @click="generateXlsx">
                            {{ $ts('export_all') }}
                        </UButton>
                    </div>

                    <div class="flex flex-wrap gap-1.5 items-center justify-center md:justify-end">
                        <UDropdownMenu :items="table?.tableApi
                            ?.getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => ({
                                label: column.id.toUpperCase(),
                                type: 'checkbox' as const,
                                checked: column.getIsVisible(),
                                onUpdateChecked(checked: boolean) {
                                    table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                                },
                                onSelect(e?: Event) {
                                    e?.preventDefault()
                                }
                            }))
                            " :content="{ align: 'end' }">
                            <UButton :label="$ts('column')" color="neutral" variant="outline"
                                trailing-icon="i-lucide-chevron-down" />
                        </UDropdownMenu>
                        <UFormField class="flex flex-col items-center gap-2" :label="$ts('show_deleted')" size="xs">
                            <USwitch v-model="deleted" id="deleted" size="xs" />
                        </UFormField>
                        <UButton icon="i-heroicons-arrow-path" variant="ghost" :size="responsiveUISizes.button"
                            @click="refresh()" :loading="pending">
                        </UButton>
                    </div>
                </div>

                <!-- Batch Update fields -->
                <div class="flex flex-col items-start gap-2 px-2 md:px-4 md:flex-row w-full md:justify-between"
                    v-if="isOrganizer && selectedMember.length > 0">
                    <div class="flex flex-col items-start gap-2 md:flex-row w-full md:w-auto">
                        <USelect v-model="selectedFieldToUpdate" :items="fieldsToUpdate"
                            :placeholder="$ts('select_field')" :size="responsiveUISizes.select"
                            class="w-full md:w-40" />
                        <UInput v-model="valueToUpdate" :placeholder="$ts('enter_value')"
                            :size="responsiveUISizes.input" class="w-full md:w-40" />
                    </div>
                    <UButton icon="i-heroicons-pencil-square-20-solid" color="neutral" variant="outline"
                        :size="responsiveUISizes.button" @click="batchUpdate">
                        {{ $ts('update_selected', { count: selectedMember.length }) }}
                    </UButton>
                </div>

                <!-- Table -->
                <div class="overflow-x-auto">
                    <UTable ref="table" v-model:column-visibility="columnVisibility" v-model:sort="sort"
                        v-model:pagination="pagination" v-model:row-selection="selectedRows"
                        v-model:column-pinning="columnPinning" :data="data.data?.members" :columns="columns"
                        :loading="pending" class="w-full">
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
                        :total="pageTotal" :sibling-count="isMobile ? 1 : 2" show-edges />
                </div>
            </template>
        </UCard>
    </div>
</template>
<style scoped></style>