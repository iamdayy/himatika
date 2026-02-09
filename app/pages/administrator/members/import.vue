<script setup lang='ts'>
import { ModalsMemberEdit, UButton, UCheckbox } from '#components';
import type { TableColumn } from '@nuxt/ui';
import { CustomFormData } from '~/helpers/CustomFormData';
import type { IMember } from '~~/types';
import type { IResponse } from '~~/types/IResponse';
const UDropdownMenu = resolveComponent('UDropdownMenu');
const NuxtImg = resolveComponent('NuxtImg');
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
        header: 'Nama Lengkap',
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
        header: 'Kelas',
        size: 100,
    },
    {
        accessorKey: 'semester',
        header: 'Semester',
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
const failedUpload = ref<boolean>(false);

const selectedCollegers = computed<IMember[]>(() => {
    return DataFromCSV.value.filter((row: IMember, index) => {
        return selectedRows.value[index] !== undefined && selectedRows.value[index] !== null;
    }) || [];
});

/**
 * Handle file upload and parse CSV data
 * @param {File} file - The uploaded CSV file
 */
const onChangeXlsx = async (file?: File | null) => {
    loading.value = true;
    if (!file) {
        toast.add({ title: 'File Not Found' });
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
        toast.add({ title: 'File Not Found' });
        loading.value = false;
    }
}

/**
 * Add selected collegers to the database
 */
const addCollegers = async () => {
    loading.value = true;
    try {
        const added = await $api<IResponse & { data: { failedMembers: IMember[]; savedCount: number; failedCount: number } }>("/api/member/batch", {
            method: "post",
            body: selectedCollegers.value
        });
        loading.value = false;
        if (added.data) {
            DataFromCSV.value = added.data?.failedMembers;
            failedUpload.value = added.data?.failedMembers.length > 0;
        }
        toast.add({ title: 'Berhasil!', description: 'Success To Add Collegers' /* params: { success: added.data?.savedCount, failed: added.data?.failedCount } */ });
    } catch (error) {
        toast.add({ title: 'Failed', description: 'Failed To Add Collegers' });
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
    const response = await $api<Blob>('/api/sheet/export', {
        method: "post",
        responseType: 'blob',
        body: {
            data: [member],
            title: 'template'
        }
    });
    const title = `template-${new Date()}`;
    const url = window.URL.createObjectURL(response as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

const downloadFailedMembers = async () => {
    const response = await $api<Blob>('/api/sheet/export', {
        method: "post",
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        body: {
            data: DataFromCSV.value,
            title: 'failed-members'
        }
    });
    const title = `failed-members-${new Date()}`;
    const url = window.URL.createObjectURL(response);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
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
        label: 'Edit',
        icon: 'i-heroicons-pencil-square-20-solid',
        click: () => editModal(row)
    }],
    [{
        label: 'Hapus',
        icon: 'i-heroicons-trash-20-solid'
    }]
]
const links = computed(() => [{
    label: 'Dasbor',
    icon: 'i-heroicons-home',
    to: '/dashboard'
}, {
    label: 'Anggota',
    icon: 'i-heroicons-users',
    to: '/administrator/members'
}, {
    label: 'Impor',
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
                        {{ 'Impor' }}
                    </h1>
                </div>
            </template>
            <div class="px-2 py-6 md:py-12 md:px-8">
                <UFileUpload @update:model-value="onChangeXlsx" :label="'Seret dan lepas file di sini atau klik untuk mengunggah'"
                    :description="'Maksimal {size} per file, maksimal {count} file. Format yang didukung: {format}.' /* params: { count: 1, format: '.xlsx', size: '5MB' } */" layout="list"
                    position="inside" :max-file-size="5 * 1024 * 1024"
                    accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, .xlsx">
                    <template #actions="{ open }">
                        <UButton :label="'Pilih'" icon="i-lucide-upload" color="neutral" variant="outline"
                            @click="open()" />
                    </template>
                </UFileUpload>
                <div class="w-full p-2 mx-auto my-3 text-center">
                    <UButton variant="subtle" @click="downloadTemplate" :size="responsiveUISizes.button"
                        icon="i-heroicons-arrow-down-on-square">
                        {{ 'Download Template' }}
                    </UButton>
                </div>
            </div>
            <USeparator class="my-2 md:my-4" />
            <div class="flex justify-between p-2 md:p-4 items-center">
                <div class="flex flex-col">
                    <h2 class="text-md font-semibold text-gray-600 md:text-lg md:font-bold dark:text-gray-200">
                        {{ 'Preview Data' }}
                    </h2>
                    <p class="text-sm font-light text-gray-600 dark:text-gray-300">
                        {{ 'Preview Data Hint' }}
                    </p>
                </div>

                <div class="flex items-center gap-2">
                    <span class="text-sm font-light text-gray-600 dark:text-gray-300">
                        {{ selectedCollegers.length }} {{ 'Selected' }}
                    </span>
                    <UButton @click="addCollegers" :size="responsiveUISizes.button" :loading="loading"
                        :disabled="DataFromCSV.length <= 0"
                        :label="'Add Member' /* params: { count: selectedCollegers.length } */" variant="solid"
                        color="primary" />
                    <UButton v-if="failedUpload" @click="downloadFailedMembers" :size="responsiveUISizes.button"
                        icon="i-heroicons-arrow-down-on-square" variant="outline" :loading="loading"
                        :disabled="DataFromCSV.length <= 0" :label="'Download Failed Member'" color="error" />
                </div>
            </div>
            <UAlert v-if="DataFromCSV.length > 0" class="mx-2 mb-4" color="warning" close :title="'Warning'"
                :description="'Import Warning Hint'" />
            <UAlert v-if="DataFromCSV.length == 0" class="mx-2 mb-4" color="info" close :title="'Info'"
                :description="'No Data Hint'" />
            <UAlert v-if="failedUpload" class="mx-2 mb-4" color="error" close :title="'Error Upload'"
                :description="'Some Members Failed To Upload'" />
            <USeparator class="my-2 md:my-4" />
            <!-- Table -->
            <UTable v-model:row-selection="selectedRows" :data="DataFromCSV" :columns="columns" :loading="loading">
            </UTable>
            <template #footer>
                <UButton @click="addCollegers" :size="responsiveUISizes.button" :loading="loading"
                    :disabled="DataFromCSV.length <= 0" :label="'Add Member' /* params: { count: selectedCollegers.length } */"
                    variant="solid" color="primary" block />
            </template>
        </UCard>
    </div>
</template>
<style scoped></style>