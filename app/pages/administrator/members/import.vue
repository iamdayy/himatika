<script setup lang='ts'>
import { ModalsMemberEdit, NuxtImg, UButton, UCheckbox } from '#components';
import type { TableColumn } from '@nuxt/ui';
import { CustomFormData } from '~/helpers/CustomFormData';
import type { IMember } from '~~/types';
import type { IExportSheetResponse, IResponse } from '~~/types/IResponse';
const UDropdownMenu = resolveComponent('UDropdownMenu');
// Define page metadata
definePageMeta({
    layout: 'dashboard',
    middleware: ['sidebase-auth', 'organizer']
});

// Set page title
useHead({
    title: "Import"
})
const { $api } = useNuxtApp();
const { $ts } = useI18n();
// Responsive design
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 640);

// Responsive UI sizes based on screen width
const responsiveUISizes = computed<{ [key: string]: 'xs' | 'md' }>(() => ({
    input: isMobile.value ? 'xs' : 'md',
    button: isMobile.value ? 'xs' : 'md',
    select: isMobile.value ? 'xs' : 'md',
}));

// Define table columns
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
        header: $ts('name'),
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
        header: $ts('class'),
        size: 100,
    },
    {
        accessorKey: 'semester',
        header: $ts('semester'),
        size: 100,
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

// Initialize toast and modal
const toast = useToast();
const overlay = useOverlay();
const EditMemberModal = overlay.create(ModalsMemberEdit)
const { convert } = useImageToBase64();
// Reactive variables
const loading = ref<boolean>(false);
const DataFromCSV = ref<IMember[]>([]);
const selectedRows = ref<{
    [key: number]: boolean;
}>({});
const selectedCollegers = computed<IMember[]>(() => {
    return DataFromCSV.value.filter((row: IMember, index) => {
        return selectedRows.value[index] !== undefined && selectedRows.value[index] !== null;
    }) || [];
});

/**
 * Handle file upload and parse CSV data
 * @param {File} file - The uploaded CSV file
 */
const onChangeXlsx = async (files: FileList) => {
    loading.value = true;
    const file = files[0];
    if (!file) {
        toast.add({ title: $ts('file_not_found') });
        loading.value = false;
        return;
    }
    try {
        const body = new CustomFormData<{ file: File }>();
        body.append('file', file)
        const uploaded = await $api<IResponse & { data: IMember[] }>("/api/sheet/import", {
            method: "POST",
            body: body.getFormData()
        });
        DataFromCSV.value = uploaded.data as IMember[];
        selectedRows.value = {
            ...Object.fromEntries(DataFromCSV.value.map((_, index) => [index, true])),
        };
        loading.value = false;
        toast.add({ title: uploaded.statusMessage });
    } catch (error) {
        toast.add({ title: $ts('file_not_found') });
        loading.value = false;
    }
}

/**
 * Add selected collegers to the database
 */
const addCollegers = async () => {
    loading.value = true;
    try {
        const added = await $api<IResponse & { data: { failedMembers: IMember[] } }>("/api/member/batch", {
            method: "post",
            body: selectedCollegers.value
        });
        loading.value = false;
        if (added.data) {
            DataFromCSV.value = added.data?.failedMembers;
        }
        toast.add({ title: $ts('success'), description: $ts('success_to_add_collegers') });
    } catch (error) {
        toast.add({ title: $ts('failed'), description: $ts('failed_to_add_collegers') });
    }
}

/**
 * Download template for CSV import
 */
const downloadTemplate = async () => {
    const member: IMember = {
        fullName: "",
        NIM: 0,
        email: "",
        sex: "male",
        class: "",
        semester: 1,
        enteredYear: new Date().getFullYear(),
    }
    const response = await $api<IExportSheetResponse>('/api/sheet/export', {
        method: "post",
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        body: {
            data: [member],
            title: 'template'
        }
    })

    if (!response.data) {
        return
    }
    const title = `template-${new Date()}`
    const link = document.createElement('a');
    link.href = response.data.url;
    link.setAttribute('download',
        `${title}.xlsx`); // Nama file yang diunduh
    document.body.appendChild(link);
    link.click();
}

/**
 * Open edit modal for a specific member
 * @param {IMember} Member - The member to edit
 */
const editModal = (Member: IMember) => {
    EditMemberModal.open({
        Member,
        onReturnObject(value: IMember) {
            const index = DataFromCSV.value.findIndex((val) => val.NIM == value.NIM);
            if (index >= 0) {
                DataFromCSV.value[index] = value;
            }
            EditMemberModal.close();
        }
    })
}

/**
 * Generate dropdown items for each row
 * @param {any} row - The row data
 * @returns {Array} Array of dropdown items
 */
const items = (row: any) => [
    [{
        label: $ts('edit'),
        icon: 'i-heroicons-pencil-square-20-solid',
        click: () => editModal(row)
    }],
    [{
        label: $ts('delete'),
        icon: 'i-heroicons-trash-20-solid'
    }]
]
const links = computed(() => [{
    label: $ts('dashboard'),
    icon: 'i-heroicons-home',
    to: '/dashboard'
}, {
    label: $ts('member'),
    icon: 'i-heroicons-users',
    to: '/administrator/members'
}, {
    label: $ts('import'),
    icon: 'i-heroicons-arrow-up-on-square'
}
]);
</script>
<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :items="links" />
        <UCard class="p-2 mt-2 md:p-4">
            <template #header>
                <div class="flex flex-row items-center justify-between w-full p-1 md:p-2">
                    <h1 class="text-lg font-semibold text-gray-600 md:text-2xl md:font-bold dark:text-gray-200">
                        {{ $ts('import') }}
                    </h1>
                </div>
            </template>
            <div class="px-2 py-6 md:py-12 md:px-8">
                <DropFile @change="onChangeXlsx" />
                <div class="w-full p-2 mx-auto my-3 text-center">
                    <UButton variant="subtle" @click="downloadTemplate" :size="responsiveUISizes.button"
                        icon="i-heroicons-arrow-down-on-square">
                        {{ $ts('download_template') }}
                    </UButton>
                </div>
            </div>
            <!-- Table -->
            <UTable v-model:row-selection="selectedRows" :data="DataFromCSV" :columns="columns" :loading="loading">
            </UTable>
            <template #footer>
                <UButton @click="addCollegers" :size="responsiveUISizes.button" :loading="loading"
                    :disabled="DataFromCSV.length <= 0" :label="$ts('add_member', { count: selectedCollegers.length })"
                    variant="solid" color="primary" block />
            </template>
        </UCard>
    </div>
</template>
<style scoped></style>