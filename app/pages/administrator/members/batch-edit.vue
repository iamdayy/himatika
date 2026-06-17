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
    title: "Batch Edit"
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
const failedUpload = ref<boolean>(false);

    const RawData = ref<any[]>([]);
    const currentStep = ref(1);

    const selectedCollegers = computed<IMember[]>(() => {
        return DataFromCSV.value.filter((row: IMember, index) => {
            return selectedRows.value[index] !== undefined && selectedRows.value[index] !== null;
        }) || [];
    });

    
    const availableColumns = computed(() => {
        if (RawData.value.length === 0) return [];
        return Object.keys(RawData.value[0]);
    });
    
    const columnMapping = ref({
        NIM: '',
        fullName: '',
        email: '',
        class: '',
        semester: '',
        enteredYear: '',
    });
    
    const autoDetectMapping = () => {
        const cols = availableColumns.value;
        const findMatch = (keywords: string[]) => cols.find(c => keywords.some(k => c.toLowerCase().includes(k.toLowerCase())));
        
        columnMapping.value.NIM = findMatch(['nim', 'no induk']) || '';
        columnMapping.value.fullName = findMatch(['nama', 'name', 'lengkap']) || '';
        columnMapping.value.email = findMatch(['email', 'surel']) || '';
        columnMapping.value.class = findMatch(['kelas', 'class']) || '';
        columnMapping.value.semester = findMatch(['semester', 'smt']) || '';
        columnMapping.value.enteredYear = findMatch(['tahun', 'masuk', 'year', 'angkatan']) || '';
    };

    const applyMapping = () => {
        if (!columnMapping.value.NIM) {
            toast.add({ title: 'Error', description: 'NIM wajib dipetakan untuk Batch Edit!', color: 'error' });
            return;
        }
        
        DataFromCSV.value = RawData.value.map((row: any) => {
            const mappedObj: any = { NIM: row[columnMapping.value.NIM] };
            if (columnMapping.value.fullName && row[columnMapping.value.fullName]) mappedObj.fullName = row[columnMapping.value.fullName];
            if (columnMapping.value.email && row[columnMapping.value.email]) mappedObj.email = row[columnMapping.value.email];
            if (columnMapping.value.class && row[columnMapping.value.class]) mappedObj.class = row[columnMapping.value.class];
            if (columnMapping.value.semester && row[columnMapping.value.semester]) mappedObj.semester = parseInt(row[columnMapping.value.semester]) || 1;
            if (columnMapping.value.enteredYear && row[columnMapping.value.enteredYear]) mappedObj.enteredYear = parseInt(row[columnMapping.value.enteredYear]);
            return mappedObj;
        });
        
        selectedRows.value = {
            ...Object.fromEntries(DataFromCSV.value.map((_, index) => [index, true])),
        };
        currentStep.value = 3;
    };

    const cancelMapping = () => {
        RawData.value = [];
        currentStep.value = 1;
    }

/**
 * Handle file upload and parse CSV data
 * @param {File} file - The uploaded CSV file
 */
const onChangeXlsx = async (file?: File | null) => {
    loading.value = true;
    if (!file) {
        toast.add({ title: $ts('file_not_found') });
        loading.value = false;
        return;
    }
    try {
        const body = new CustomFormData<{ file: File }>();
        body.append('file', file)
        const uploaded = await $api<IResponse & { data: any[] }>("/api/sheet/import", {
            method: "POST",
            body: body.getFormData()
        });
        RawData.value = uploaded.data;
        autoDetectMapping();
        currentStep.value = 2; // Go to mapping step
        loading.value = false;
        toast.add({ title: 'File berhasil dibaca, silakan petakan kolom' });
    } catch (error) {
        toast.add({ title: $ts('file_not_found') });
        loading.value = false;
    }
}

const addCollegers = async () => {
    loading.value = true;
    try {
        const added = await $api<IResponse & { data: { failedMembers: IMember[]; savedCount: number; failedCount: number } }>("/api/member/batch-edit", {
            method: "post",
            body: selectedCollegers.value
        });
        loading.value = false;
        if (added.data) {
            DataFromCSV.value = added.data?.failedMembers;
            failedUpload.value = added.data?.failedMembers.length > 0;
            if(added.data?.failedMembers.length === 0) {
                 toast.add({ title: $ts('success'), description: $ts('success_to_update_member', { success: added.data?.savedCount, failed: added.data?.failedCount }) });
                 navigateTo('/administrator/members');
                 return;
            }
        }
        toast.add({ title: $ts('success'), description: $ts('success_to_update_member', { success: added.data?.savedCount, failed: added.data?.failedCount }) });
    } catch (error) {
        toast.add({ title: $ts('failed'), description: $ts('failed_to_update_member') });
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
    label: 'Batch Edit (Excel)',
    icon: 'i-heroicons-pencil-square-20-solid'
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
                        Batch Edit (Excel)
                    </h1>
                </div>
            </template>
            
            <!-- STEP 1: UPLOAD -->
            <div v-if="currentStep === 1" class="px-2 py-6 md:py-12 md:px-8">
                <UFileUpload @update:model-value="onChangeXlsx" :label="$ts('drop_zone')"
                    :description="$ts('drop_zone_hint', { count: 1, format: '.xlsx', size: '5MB' })" layout="list"
                    position="inside" :max-file-size="5 * 1024 * 1024"
                    accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, .xlsx">
                    <template #actions="{ open }">
                        <UButton :label="$ts('select')" icon="i-lucide-upload" color="neutral" variant="outline"
                            @click="open()" />
                    </template>
                </UFileUpload>
                <div class="w-full p-2 mx-auto my-3 text-center">
                    <UButton variant="subtle" @click="downloadTemplate" :size="responsiveUISizes.button"
                        icon="i-heroicons-arrow-down-on-square">
                        {{ $ts('download_template') }}
                    </UButton>
                </div>
            </div>

            <!-- STEP 2: MAPPING -->
            <div v-if="currentStep === 2" class="px-2 py-4 md:px-8">
                <div class="mb-4">
                    <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Pencocokan Kolom (Column Mapping)</h2>
                    <p class="text-sm text-gray-500">Pilih kolom Excel yang sesuai. Untuk Batch Edit, hanya kolom NIM yang wajib. Kolom lain yang dikosongkan tidak akan mengubah data yang ada.</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <UFormField label="NIM (Wajib)" required>
                        <USelect v-model="columnMapping.NIM" :items="availableColumns" placeholder="Pilih Kolom Excel..." class="w-full" />
                    </UFormField>
                    <UFormField label="Nama Lengkap">
                        <USelect v-model="columnMapping.fullName" :items="availableColumns" placeholder="Biarkan kosong jika tak diubah..." class="w-full" />
                    </UFormField>
                    <UFormField label="Email">
                        <USelect v-model="columnMapping.email" :items="availableColumns" placeholder="Biarkan kosong jika tak diubah..." class="w-full" />
                    </UFormField>
                    <UFormField label="Kelas">
                        <USelect v-model="columnMapping.class" :items="availableColumns" placeholder="Biarkan kosong jika tak diubah..." class="w-full" />
                    </UFormField>
                    <UFormField label="Semester">
                        <USelect v-model="columnMapping.semester" :items="availableColumns" placeholder="Biarkan kosong jika tak diubah..." class="w-full" />
                    </UFormField>
                    <UFormField label="Tahun Masuk / Angkatan">
                        <USelect v-model="columnMapping.enteredYear" :items="availableColumns" placeholder="Biarkan kosong jika tak diubah..." class="w-full" />
                    </UFormField>
                </div>

                <div class="flex justify-end gap-2 mt-6">
                    <UButton @click="cancelMapping" color="neutral" variant="soft">Batal</UButton>
                    <UButton @click="applyMapping" color="primary">Lanjut ke Preview</UButton>
                </div>
            </div>

            <!-- STEP 3: PREVIEW & SUBMIT -->
            <div v-if="currentStep === 3">
                <div class="flex justify-between p-2 md:p-4 items-center">
                    <div class="flex flex-col">
                        <h2 class="text-md font-semibold text-gray-600 md:text-lg md:font-bold dark:text-gray-200">
                            {{ $ts('preview_data') }}
                        </h2>
                        <p class="text-sm font-light text-gray-600 dark:text-gray-300">
                            {{ $ts('preview_data_hint') }}
                        </p>
                    </div>

                    <div class="flex items-center gap-2">
                        <span class="text-sm font-light text-gray-600 dark:text-gray-300">
                            {{ selectedCollegers.length }} {{ $ts('selected') }}
                        </span>
                        <UButton @click="addCollegers" :size="responsiveUISizes.button" :loading="loading"
                            :disabled="DataFromCSV.length <= 0"
                            :label="$ts('update_selected', { count: selectedCollegers.length })" variant="solid"
                            color="primary" />
                        <UButton v-if="failedUpload" @click="downloadFailedMembers" :size="responsiveUISizes.button"
                            icon="i-heroicons-arrow-down-on-square" variant="outline" :loading="loading"
                            :disabled="DataFromCSV.length <= 0" :label="$ts('download_failed_member')" color="error" />
                    </div>
                </div>
                
                <UAlert v-if="DataFromCSV.length > 0" class="mx-2 mb-4" color="warning" close :title="$ts('warning')"
                    :description="$ts('import_warning_hint')" />
                <UAlert v-if="DataFromCSV.length == 0" class="mx-2 mb-4" color="info" close :title="$ts('info')"
                    :description="$ts('no_data_hint')" />
                <UAlert v-if="failedUpload" class="mx-2 mb-4" color="error" close :title="$ts('error_upload')"
                    :description="$ts('some_members_failed_to_upload')" />
                
                <!-- Table -->
                <UTable v-model:row-selection="selectedRows" :data="DataFromCSV.slice(0, 50)" :columns="columns" :loading="loading">
                </UTable>
                <div v-if="DataFromCSV.length > 50" class="text-center p-4 text-sm text-gray-500 dark:text-gray-400">
                    Menampilkan 50 data pertama sebagai preview. (Total {{ DataFromCSV.length }} data siap diperbarui)
                </div>
                
                <div class="p-4 border-t border-gray-100 flex justify-between">
                    <UButton @click="currentStep = 2" color="neutral" variant="ghost" icon="i-heroicons-arrow-left">Kembali ke Mapping</UButton>
                    <UButton @click="addCollegers" :size="responsiveUISizes.button" :loading="loading"
                        :disabled="DataFromCSV.length <= 0" :label="$ts('update_selected', { count: selectedCollegers.length })"
                        variant="solid" color="primary" />
                </div>
            </div>
        </UCard>
    </div>
</template>

<style scoped></style>