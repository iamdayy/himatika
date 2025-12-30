<script setup lang='ts'>
import { UButton, UCheckbox, UFileUpload, UTable } from '#components';
import type { TableColumn } from '@nuxt/ui';
import { CustomFormData } from '~/helpers/CustomFormData';
import type { IMember } from '~~/types';
import type { IAgendaResponse } from '~~/types/IResponse';

definePageMeta({
    layout: 'dashboard',
    middleware: ['sidebase-auth', 'organizer']
});

const route = useRoute();
const id = route.params.id as string;
const { $api, $ts } = useNuxtApp();
const toast = useToast();
const sizes = useResponsiveUiSizes();

// State
const loading = ref(false);
const file = ref<File | null>(null);
const parsedData = ref<any[]>([]); // Data hasil preview excel

const selectedRows = ref<{
    [key: number]: boolean;
}>({});
const selectedMembers = computed<IMember[]>(() => {
    return parsedData.value.filter((row: IMember, index) => {
        return selectedRows.value[index] !== undefined && selectedRows.value[index] !== null;
    }) || [];
});

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
                size: sizes.input,
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
    },
    {
        accessorKey: 'NIM',
        header: $ts('NIM'),
        size: 150,
    },
    {
        accessorKey: 'Name',
        header: $ts('Nama (Preview)'),
        size: 100,
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            return h(UButton, {
                icon: 'i-heroicons-trash',
                color: 'error',
                variant: 'ghost',
                size: sizes.button,
                onClick: () => {
                    const index = parsedData.value.indexOf(row.original);
                    if (index > -1) {
                        parsedData.value.splice(index, 1);
                        toast.add({ title: `Data NIM ${row.original.NIM} dihapus`, color: 'info' });
                    }
                }
            });
        },
    },
]);

// 1. Download Template Excel
const downloadTemplate = async () => {
    // Menggunakan library sheetjs / endpoint export yang sudah ada
    // Kita buat data dummy sederhana
    const templateData = [
        { NIM: 12345678, Nama: "Contoh Nama (Opsional)" },
        { NIM: 87654321, Nama: "Contoh Dua" }
    ];

    // Panggil endpoint export (reuse yang ada)
    const response = await $api<Blob>('/api/sheet/export', {
        method: "post",
        headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        body: { data: templateData, title: 'template' }
    });

    const url = window.URL.createObjectURL(response);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-peserta.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

// 2. Upload & Preview (Parse Excel di Server sementara / Client)
// Kita gunakan endpoint /api/sheet/import yang sudah ada di kode Anda untuk parsing
const handleFileUpload = async () => {
    if (!file.value) return;
    loading.value = true;

    try {
        const body = new CustomFormData<{ file: File }>();
        body.append('file', file.value);

        // Reuse endpoint import yang mengembalikan JSON dari Excel
        const res = await $api<any>("/api/sheet/import", {
            method: "POST",
            body: body.getFormData()
        });

        // Filter kolom yang penting saja (NIM)
        parsedData.value = res.data.map((row: any) => ({
            NIM: row.NIM || row.nim, // Case insensitive check
            Name: row.fullName || row.Nama || row.name || 'Unknown' // Hanya untuk display preview
        })).filter((r: any) => r.NIM); // Pastikan ada NIM

        toast.add({ title: `Berhasil membaca ${parsedData.value.length} baris data` });
    } catch (e) {
        toast.add({ title: 'Gagal membaca file', color: 'error' });
    } finally {
        loading.value = false;
    }
};

// 3. Submit ke Batch API
const submitImport = async () => {
    if (selectedMembers.value.length === 0) return;
    loading.value = true;

    try {
        const nims = selectedMembers.value.map(p => p.NIM);

        await $api(`/api/agenda/${id}/participant/batch`, {
            method: 'POST',
            body: { nims }
        });

        toast.add({ title: 'Import berhasil!', color: 'success' });
        navigateTo(`/administrator/agendas/${id}/participant`);
    } catch (e: any) {
        toast.add({ title: 'Gagal import', description: e.statusMessage, color: 'error' });
    } finally {
        loading.value = false;
    }
};

const { data: agenda } = await useAsyncData('admin-agenda-detail',
    () => $api<IAgendaResponse>('/api/agenda', { query: { id } }), {
    transform: (data) => data.data?.agenda
});

// Navigation Links
const links = computed(() => [{
    label: $ts('dashboard'),
    icon: 'i-heroicons-home',
    to: '/dashboard'
}, {
    label: $ts('agenda'),
    icon: 'i-heroicons-calendar',
    to: '/administrator/agendas'
},
{
    label: agenda?.value?.title || 'Agenda',
    icon: 'i-heroicons-calendar',
    to: `/administrator/agendas/${id}`
},
{
    label: $ts('participant'),
    to: `/administrator/agendas/${id}/participant`,
    icon: 'i-heroicons-link'
},
{
    label: $ts('import-participant'),
    icon: 'i-heroicons-user-plus',
}
]);
</script>

<template>
    <div class="mb-24 space-y-6">
        <UBreadcrumb :items="links" />
        <UCard>
            <template #header>
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold">Import Peserta Massal</h1>
                    <UButton icon="i-heroicons-arrow-down-tray" variant="soft" @click="downloadTemplate">
                        Download Template
                    </UButton>
                </div>
            </template>
            <div class="space-y-4">
                <UAlert title="Instruksi" icon="i-heroicons-information-circle" color="primary" variant="subtle">
                    <template #description>
                        Upload file Excel (.xlsx). Pastikan ada kolom bernama <b>NIM</b>.
                        Sistem akan otomatis mencocokkan NIM dengan database Member.
                    </template>
                </UAlert>
                <UFileUpload @change="handleFileUpload" :label="$ts('drop_zone')"
                    :description="$ts('drop_zone_hint', { count: 1, format: '.xlsx', size: '5MB' })" layout="list"
                    position="inside" :max-file-size="5 * 1024 * 1024"
                    accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, .xlsx" v-model="file">
                </UFileUpload>

                <USeparator class="my-2 md:my-4" />
                <UTable v-model:row-selection="selectedRows" :data="parsedData" :columns="columns" :loading="loading">
                </UTable>

                <div class="flex justify-between pt-4">
                    <UButton variant="ghost" to="../participant">Batal</UButton>
                    <UButton :loading="loading" :disabled="parsedData.length === 0" @click="submitImport"
                        color="primary" size="lg">
                        Mulai Import Data
                    </UButton>
                </div>
            </div>
        </UCard>
    </div>
</template>