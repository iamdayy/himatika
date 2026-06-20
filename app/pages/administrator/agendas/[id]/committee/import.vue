<script setup lang='ts'>
import { UButton, UCheckbox, UFileUpload, USwitch, UTable } from '#components';
import type { TableColumn } from '@nuxt/ui';
import { CustomFormData } from '~/helpers/CustomFormData';
import type { IMember } from '~~/types';
import type { IAgendaResponse } from '~~/types/IResponse';
definePageMeta({ layout: 'dashboard', middleware: ['sidebase-auth', 'organizer'] });
const route = useRoute();
const id = route.params.id as string;
const { $api, $ts } = useNuxtApp();
const toast = useToast();
const sizes = useResponsiveUiSizes();

const { data: agenda, pending: pendingAgenda } = useLazyAsyncData('admin-agenda-detail',
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
    label: $ts('committee'),
    to: `/administrator/agendas/${id}/committee`,
    icon: 'i-heroicons-link'
},
{
    label: $ts('import-committee'),
    icon: 'i-heroicons-user-group',
}
]);

const file = ref<File | null>(null);
const loading = ref(false);
const parsedData = ref<any[]>([]);
const selectedRows = ref<{
    [key: number]: boolean;
}>({});

const paymentStatus = ref(true); // true = success, false = pending
const paymentMethod = ref('cash');
const isVisiting = ref(false);

const failedUpload = ref<boolean>(false);
const failedMembers = ref<any[]>([]);

const paymentStatusOptions = ['pending', 'success', 'failed'];
const paymentMethodOptions = ['cash', 'bank_transfer', 'qris', 'manual_transfer'];

const selectedMembers = computed<{ nim: number; job: string; name: string; payment: boolean; visiting: boolean; }[]>(() => {
    return parsedData.value.filter((row: IMember, index) => {
        return selectedRows.value[index] !== undefined && selectedRows.value[index] !== null;
    }) || [];
});


const columns = computed<TableColumn<any>[]>(() => [
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
        accessorKey: 'nim',
        header: $ts('NIM'),
        size: 150,
    },
    {
        accessorKey: 'job',
        header: $ts('Jabatan'),
        size: 100,
    },
    {
        accessorKey: 'payment',
        header: 'Bayar?',
        cell: ({ row }) => {
            return h(USwitch, {
                modelValue: row.original.payment,
                'onUpdate:modelValue': (val: boolean) => {
                    row.original.payment = val;
                }
            });
        }
    },
    {
        accessorKey: 'visiting',
        header: 'Hadir?',
        cell: ({ row }) => {
            return h(USwitch, {
                modelValue: row.original.visiting,
                'onUpdate:modelValue': (val: boolean) => {
                    row.original.visiting = val;
                }
            });
        }
    },
    {
        accessorKey: 'name',
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

const downloadTemplate = async () => {
    const templateData = [
        { NIM: 12345678, Jabatan: "Ketua Pelaksana" },
        { NIM: 87654321, Jabatan: "Anggota Pubdok" }
    ];
    const response = await $api<Blob>('/api/sheet/export', {
        method: "post",
        responseType: 'blob',
        body: { data: templateData, title: 'template' }
    });
    const url = window.URL.createObjectURL(response as Blob);
    const a = document.createElement('a');
    a.href = url; a.download = `template-panitia.xlsx`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
};

const downloadFailedMembers = async () => {
    const response = await $api<Blob>('/api/sheet/export', {
        method: "post",
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        body: {
            data: failedMembers.value,
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

const handleFileUpload = async () => {
    if (!file.value) return;
    loading.value = true;
    try {
        const body = new CustomFormData<{ file: File }>();
        body.append('file', file.value);
        const res = await $api<any>("/api/sheet/import", { method: "POST", body: body.getFormData() });

        // Mapping kolom excel
        parsedData.value = res.data.map((row: any) => ({
            nim: row.NIM || row.nim,
            name: row.fullName || row.Nama || 'Unknown',
            job: row.Jabatan || row.jabatan || row.Job || 'Anggota', // Default jika kosong
            payment: paymentStatus.value,
            visiting: isVisiting.value
        })).filter((r: any) => r.nim);

        toast.add({ title: `Siap import ${parsedData.value.length} panitia` });
    } catch { toast.add({ title: 'Gagal baca file', color: 'error' }); }
    finally { loading.value = false; }
};

const submitImport = async () => {
    if (selectedMembers.value.length === 0) {
        toast.add({ title: 'Pilih panitia terlebih dahulu', color: 'warning' });
        return;
    }
    loading.value = true;
    try {
        const added = await $api<any>(`/api/agenda/${id}/committee/batch`, {
            method: 'POST',
            body: {
                data: selectedMembers.value.map((m) => ({
                    nim: m.nim,
                    job: m.job,
                    payment: {
                        status: m.payment ? 'success' : 'pending',
                        method: paymentMethod.value,
                        time: new Date()
                    },
                    visiting: m.visiting
                }))
            } // Kirim array nim & job
        });
        if (added.data?.failedMembers?.length > 0) {
            failedMembers.value = added.data.failedMembers;
            failedUpload.value = true;
            toast.add({ title: `Berhasil import ${added.data.savedCount} data. Gagal ${added.data.failedCount} data.`, color: 'warning' });
        } else {
            toast.add({ title: 'Import Panitia sukses', color: 'success' });
            navigateTo(`/administrator/agendas/${id}/committee`);
        }
    } catch (e: any) {
        toast.add({ title: 'Gagal', description: e.statusMessage, color: 'error' });
    } finally { loading.value = false; }
};
</script>

<template>
    <div class="mb-24 space-y-6">
        <UBreadcrumb :items="links" />
        <div v-if="pendingAgenda" class="space-y-4">
            <USkeleton class="h-10 w-1/4" />
            <UCard>
                <div class="space-y-4">
                    <USkeleton class="h-8 w-full" />
                    <USkeleton class="h-12 w-full" />
                    <USkeleton class="h-48 w-full" />
                </div>
            </UCard>
        </div>
        <UCard v-else>
            <template #header>
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold">Import Panitia Massal</h1>
                    <UButton icon="i-heroicons-arrow-down-tray" variant="soft" @click="downloadTemplate">
                        Download Template
                    </UButton>
                </div>
            </template>
            <div class="space-y-4">
                <UAlert title="Format Excel" description="Pastikan kolom: NIM dan Jabatan" color="primary"
                    variant="subtle" />

                <UFileUpload @change="handleFileUpload" :label="$ts('drop_zone')"
                    :description="$ts('drop_zone_hint', { count: 1, format: '.xlsx', size: '5MB' })" layout="list"
                    position="inside" :max-file-size="5 * 1024 * 1024"
                    accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, .xlsx" v-model="file">
                </UFileUpload>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <UFormGroup label="Status Pembayaran (Default)">
                        <USwitch v-model="paymentStatus" />
                        <span class="ml-2 text-sm">{{ paymentStatus ? 'Lunas' : 'Belum Lunas' }}</span>
                    </UFormGroup>
                    <UFormGroup label="Metode Pembayaran (Default)">
                        <USelect v-model="paymentMethod" :options="paymentMethodOptions" />
                    </UFormGroup>
                    <UFormGroup label="Status Kehadiran (Default)">
                        <USwitch v-model="isVisiting" />
                        <span class="ml-2 text-sm">{{ isVisiting ? 'Hadir' : 'Tidak Hadir' }}</span>
                    </UFormGroup>
                </div>

                <USeparator class="my-2 md:my-4" />
                <UAlert v-if="failedUpload" class="mb-4" color="error" close :title="$ts('error_upload')"
                    :description="$ts('some_members_failed_to_upload')" />
                <UTable v-model:row-selection="selectedRows" :data="parsedData.slice(0, 50)" :columns="columns" :loading="loading">
                </UTable>
                <div v-if="parsedData.length > 50" class="text-center p-4 text-sm text-gray-500 dark:text-gray-400">
                    Menampilkan 50 data pertama sebagai preview. (Total {{ parsedData.length }} data siap diimpor)
                </div>

                <div class="flex justify-between pt-4 items-center">
                    <UButton variant="ghost" to="../committee">Batal</UButton>
                    <div class="flex gap-2">
                        <UButton v-if="failedUpload" @click="downloadFailedMembers" color="error" variant="outline" icon="i-heroicons-arrow-down-on-square">
                            Download Failed Members
                        </UButton>
                        <UButton :loading="loading" :disabled="parsedData.length === 0 || selectedMembers.length === 0"
                            @click="submitImport" color="primary">
                            Eksekusi Import
                        </UButton>
                    </div>
                </div>
            </div>
        </UCard>
    </div>
</template>