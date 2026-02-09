<script setup lang='ts'>
import { ModalsConfirmation, UCheckbox, UIcon } from '#components';
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui';
import type { Row } from '@tanstack/vue-table';
import type { IAgenda, ICommittee, IMember } from '~~/types';
import type { IAgendaCommitteeResponse } from '~~/types/IResponse';

definePageMeta({
    layout: 'client',
    auth: false
});

const UButton = resolveComponent('UButton');
const UBadge = resolveComponent('UBadge');
const UDropdownMenu = resolveComponent('UDropdownMenu');
const NuxtImg = resolveComponent('NuxtImg');

const table = useTemplateRef('table')
const pagination = ref({
    pageIndex: 1,
    pageSize: 10 // Default lebih besar agar enak dilihat
})

const route = useRoute();
const { $api } = useNuxtApp()
const overlay = useOverlay();

const ConfirmationModal = overlay.create(ModalsConfirmation);

const id = route.params.id;
const search = ref('');
const { data, refresh, pending } = useLazyAsyncData(() => $api<IAgendaCommitteeResponse>(`/api/agenda/${id}/committee`, {
    method: 'GET',
    query: {
        page: pagination.value.pageIndex,
        perPage: pagination.value.pageSize,
        search: search.value,
    }
}), {
    watch: [() => pagination.value.pageIndex, () => pagination.value.pageSize, search],
});

const toast = useToast();
const agenda = computed<IAgenda | undefined>(() => data.value?.data?.agenda);
const { isCommittee } = useAgendas(agenda);
const organizerStore = useOrganizerStore();
const { isOrganizer } = storeToRefs(organizerStore);

const selectedRows = ref<{ [key: number]: boolean }>({});

const selectedCommittee = computed<ICommittee[]>(() => {
    return data.value?.data?.committees?.filter((_, index) => {
        return selectedRows.value[index] !== undefined && selectedRows.value[index] !== null;
    }) || [] as ICommittee[]
});
const members = computed(() => data.value?.data?.committees || []);

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 640)
const responsiveUISizes = computed<{ [key: string]: 'xs' | 'md' }>(() => ({
    button: isMobile.value ? 'xs' : 'md',
    select: isMobile.value ? 'xs' : 'md',
    pagination: isMobile.value ? 'xs' : 'md',
}));

// --- FUNGSI CETAK ID CARD PANITIA (MODERN) ---
const printIdCards = () => {
    const targets = selectedCommittee.value.length > 0 ? selectedCommittee.value : members.value;

    if (targets.length === 0) {
        return toast.add({ title: 'Tidak ada data panitia', color: 'warning' });
    }

    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) return;

    const styles = `
        @page { size: A4; margin: 10mm; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
            background: #f0f0f0; /* Hanya visual di layar, tidak terprint jika default settings */
        }
        .grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 15px; 
            page-break-after: always;
        }
        .card { 
            border: 2px solid #333; 
            height: 300px; /* Sedikit lebih tinggi untuk job title */
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            text-align: center; 
            padding: 20px;
            page-break-inside: avoid; 
            border-radius: 12px; 
            position: relative;
            background: #fff;
        }
        .header { 
            font-size: 14px; 
            text-transform: uppercase; 
            letter-spacing: 1px;
            margin-bottom: 10px; 
            color: #666; 
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
            width: 80%;
        }
        .name { 
            font-size: 26px; 
            font-weight: 800; 
            margin: 10px 0 5px 0; 
            line-height: 1.2;
            color: #000;
        }
        .job { 
            font-size: 18px; 
            color: #d946ef; /* Warna ungu/pink untuk panitia (opsional) */
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .meta { font-size: 14px; color: #555; }
        .badge-box {
            margin-top: 15px;
            border: 2px solid #000;
            color: #000;
            padding: 5px 20px;
            font-weight: bold;
            font-size: 14px;
            border-radius: 4px;
        }
        .footer { position: absolute; bottom: 10px; font-size: 10px; color: #888; }
    `;

    const cardsHtml = targets.map(c => {
        const member = c.member as IMember | undefined;
        const name = member?.fullName || 'Panitia';
        const nim = member?.NIM || '-';
        const job = c.job || 'Volunteer';

        return `
            <div class="card">
                <div class="header">${agenda.value?.title || 'OFFICIAL EVENT'}</div>
                <h1 class="name">${name}</h1>
                <div class="job">${job}</div>
                <p class="meta">${nim}</p>
                <div class="badge-box">COMMITTEE</div>
                <div class="footer">ID: ${c._id}</div>
            </div>
        `;
    }).join('');

    win.document.title = `ID Card Panitia - ${agenda.value?.title}`;

    const styleSheet = win.document.createElement("style");
    styleSheet.innerText = styles;
    win.document.head.appendChild(styleSheet);

    win.document.body.innerHTML = `<div class="grid">${cardsHtml}</div>`;

    setTimeout(() => {
        win.print();
    }, 500);
};

// --- BULK ACTIONS ---
const bulkActions = computed<DropdownMenuItem[][]>(() => [
    [{
        label: `Terpilih (${selectedCommittee.value.length})`,
        disabled: true
    }],
    [{
        label: 'Export Data',
        icon: 'i-heroicons-document-arrow-down',
        onSelect: generateXlsx
    }, {
        label: 'Cetak ID Card',
        icon: 'i-heroicons-identification',
        onSelect: printIdCards
    }],
    [{
        label: 'Set Visit Status',
        icon: 'i-heroicons-check-circle',
        disabled: selectedCommittee.value.length === 0,
        onSelect: () => setBatch('visiting')
    }, {
        label: 'Atur Status Pembayaran',
        icon: 'i-heroicons-banknotes',
        disabled: selectedCommittee.value.length === 0,
        onSelect: () => setBatch('payment')
    }]
]);

// --- TABLE COLUMNS ---
const columns = computed<TableColumn<ICommittee>[]>(() => {
    const baseColumns: TableColumn<ICommittee>[] = [
        {
            id: 'select',
            header: ({ table }) =>
                h(UCheckbox, {
                    modelValue: table.getIsSomePageRowsSelected() ? 'indeterminate' : table.getIsAllPageRowsSelected(),
                    'onUpdate:modelValue': (value: boolean | 'indeterminate') => table.toggleAllPageRowsSelected(!!value),
                }),
            cell: ({ row }) =>
                h(UCheckbox, {
                    modelValue: row.getIsSelected(),
                    size: responsiveUISizes.value.input,
                    'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
                })
        },
        {
            accessorKey: 'fullName',
            header: 'Nama Lengkap',
            size: 200,
            cell: ({ row }) => {
                return h('div', { class: 'flex flex-row items-center gap-3' }, [
                    h(NuxtImg, {
                        src: (row.original.member as IMember | undefined)?.avatar as string || '/img/profile-blank.png',
                        class: 'object-cover rounded-full w-10 h-10 border border-gray-200',
                        loading: 'lazy'
                    }),
                    h('div', { class: 'flex flex-col items-start' }, [
                        h('span', { class: 'font-semibold text-gray-900 dark:text-white line-clamp-1' },
                            (row.original.member as IMember | undefined)?.fullName),
                        h('span', { class: 'text-xs text-gray-500 dark:text-gray-300 line-clamp-1' },
                            `${(row.original.member as IMember | undefined)?.NIM} | ${(row.original.member as IMember | undefined)?.class || '-'}`),
                    ]),
                ]);
            }
        },
        {
            accessorKey: 'job',
            header: 'Jabatan',
            cell: ({ row }) => h(UBadge, { color: 'primary', variant: 'subtle', size: 'xs' }, () => row.original.job || '-')
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                return h(UBadge, {
                    color: row.original.approved ? 'success' : 'orange',
                    variant: row.original.approved ? 'soft' : 'outline',
                    label: row.original.approved ? 'Disetujui' : 'Pending'
                })
            }
        },
    ];

    if (isCommittee.value || isOrganizer.value) {
        const committeeColumns: TableColumn<ICommittee>[] = [
            {
                accessorKey: 'payment',
                header: 'Bayar', // Singkat agar muat di mobile
                cell: ({ row }) => {
                    if (!agenda.value?.configuration.committee.pay) return h('span', { class: 'text-gray-400 text-xs' }, '-');
                    const status = row.original.payment?.status;
                    return h(UBadge, {
                        color: status === 'success' ? 'success' : 'error',
                        variant: 'subtle',
                        label: status === 'success' ? 'Lunas' : 'Belum'
                    })
                }
            },
            {
                accessorKey: 'visiting',
                header: 'Hadir',
                cell: ({ row }) => {
                    return row.original.visiting
                        ? h('div', { class: 'text-green-500 flex justify-center' }, h(UIcon, { name: 'i-heroicons-check-circle', class: 'w-5 h-5' }))
                        : h('div', { class: 'text-gray-300 flex justify-center' }, h(UIcon, { name: 'i-heroicons-minus-circle', class: 'w-5 h-5' }))
                }
            },
            {
                id: 'actions',
                cell: ({ row }) => {
                    return h(
                        'div', { class: 'text-right' },
                        h(UDropdownMenu, {
                            content: { align: 'end' },
                            items: getRowItems(row)
                        }, () => h(UButton, {
                            icon: 'i-lucide-ellipsis-vertical',
                            color: 'neutral',
                            variant: 'ghost',
                            size: 'xs'
                        }))
                    )
                }
            }
        ];
        return [...baseColumns, ...committeeColumns];
    }
    return baseColumns;
});

function getRowItems(row: Row<ICommittee>): DropdownMenuItem[] {
    return [
        { type: 'label', label: 'Menu Panitia' },
        {
            icon: 'i-heroicons-eye',
            label: 'Detail Info',
            to: `profile/${(row.original.member as IMember)?.NIM || '-'}`,
            disabled: !isOrganizer.value && !isCommittee.value && !row.original.member,
        },
        {
            icon: 'i-heroicons-check-badge',
            label: row.original.approved ? 'Batalkan Approval' : 'Setujui (Approve)',
            disabled: !isOrganizer.value && !isCommittee.value,
            onSelect: () => setApproved(row.original._id as string) // Toggle logic bisa ditambahkan di backend atau handler terpisah
        },
        { type: 'separator' },
        {
            icon: 'i-heroicons-check-circle',
            label: 'Tandai Hadir',
            disabled: row.original.visiting,
            onSelect: () => openSetVisitedModal(row.original._id as string)
        },
        {
            icon: 'i-heroicons-banknotes',
            label: 'Tandai Lunas',
            disabled: row.original.payment?.status === 'success' || agenda.value?.configuration.committee.pay === false,
            onSelect: () => setPaid(row.original._id as string)
        },
        { type: 'separator' },
        {
            icon: 'i-heroicons-trash',
            label: 'Hapus',
            color: 'error',
            disabled: !isCommittee.value,
            onSelect: () => deleteCommittee(row.original._id as string)
        }
    ]
}

// --- UTILS & API CALLS ---
const flattenData = (obj: Object): Object => {
    return Object.assign({},
        Object.fromEntries(Object.values(obj).filter((x) => typeof x === "object").map((x) => Object.entries(x)).flat(1)),
        Object.fromEntries(Object.entries(obj).filter(([, x]) => typeof x !== "object"))
    );
}

const generateXlsx = async () => {
    try {
        const dataToExport = selectedCommittee.value.length > 0 ? selectedCommittee.value : members.value;
        if (!dataToExport.length) throw new Error('No data to export');

        const flatData = dataToExport.map((item) => flattenData(item));
        const headers = [
            { header: "Nama Lengkap", key: "fullName" },
            { header: "NIM", key: "NIM" },
            { header: "Jabatan", key: "job" },
            { header: "Status Approval", key: "approved" },
            { header: "Status Pembayaran", key: "status" }, // dari flatten payment.status
        ];

        const response = await $fetch<Blob>('/api/sheet/export', {
            method: "post",
            responseType: 'blob',
            body: { title: "Committee-Data", headers, data: flatData }
        });

        if (!response) throw new Error('No data returned');

        const blob = response;
        const link = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `Committee-${new Date().toISOString()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.add({ title: 'Export Berhasil', color: 'success' });
    } catch (error: any) {
        toast.add({ title: 'Export Gagal', description: error.message, color: 'error' });
    }
}

// Pagination computed
const pageTotal = computed(() => data.value?.data?.length || 0);
const pageFrom = computed(() => (pagination.value.pageIndex) * pagination.value.pageSize);
const pageTo = computed(() => Math.min((pagination.value.pageIndex + 1) * pagination.value.pageSize, pageTotal.value));
const perPageOptions = [5, 10, 20, 50, 100];

const deleteCommittee = async (committeeId: string) => {
    ConfirmationModal.open({
        title: 'Delete Committee',
        body: 'Delete Committee Confirmation',
        onConfirm: async () => {
            try {
                await $api(`/api/agenda/${id}/committee/register/${committeeId}`, { method: "DELETE" });
                toast.add({ title: 'Berhasil!', description: 'Success To Delete Committee' });
                refresh();
            } catch (error) {
                toast.add({ title: 'Failed', color: 'error' });
            } finally {
                ConfirmationModal.close();
            }
        }
    });
}

const setPaid = async (registeredId: string) => {
    try {
        await $api(`/api/agenda/${id}/committee/register/${registeredId}/pay`, { method: 'put' });
        toast.add({ title: 'Status Pembayaran Diupdate', color: 'success' });
        refresh();
    } catch (error) {
        toast.add({ title: 'Gagal update pembayaran', color: 'error' });
    }
}

const setVisited = async (registeredId: string) => {
    try {
        await $api(`/api/agenda/${id}/committee/register/${registeredId}/visited`);
        toast.add({ title: 'Status Kehadiran Diupdate', color: 'success' });
        refresh();
    } catch (error) {
        toast.add({ title: 'Gagal update kehadiran', color: 'error' });
    }
}

const openSetVisitedModal = (registeredId: string) => {
    ConfirmationModal.open({
        title: 'Konfirmasi Kehadiran',
        body: 'Apakah panitia ini benar-benar hadir?',
        onConfirm: async () => {
            await setVisited(registeredId);
            ConfirmationModal.close();
        }
    })
}

const setApproved = async (registeredId: string) => {
    try {
        await $api(`/api/agenda/${id}/committee/register/${registeredId}/approve`, { method: 'put' });
        toast.add({ title: 'Status Approval Diupdate', color: 'success' });
        refresh();
    } catch (error) {
        toast.add({ title: 'Gagal update approval', color: 'error' });
    }
}

const setBatch = async (field: 'payment' | 'visiting') => {
    ConfirmationModal.open({
        title: 'Konfirmasi Massal',
        body: `Update ${selectedCommittee.value.length} data sekaligus?`,
        onConfirm: async () => {
            try {
                await $api(`/api/agenda/${id}/committee/register/batch`, {
                    method: 'post',
                    body: { committees: selectedCommittee.value.map((p) => p._id), field }
                });
                toast.add({ title: 'Batch Update Berhasil', color: 'success' });
                refresh();
                // table.value?.toggleAllPageRowsSelected(false); // Reset selection
            } catch (error) {
                toast.add({ title: 'Gagal Batch Update', color: 'error' });
            } finally {
                ConfirmationModal.close();
            }
        }
    });
}

const links = computed(() => [
    { label: 'Dasbor', icon: 'i-heroicons-home', to: '/dashboard' },
    { label: 'Agenda', icon: 'i-heroicons-calendar', to: '/administrator/agendas' },
    { label: agenda.value?.title || 'Agenda', to: `/administrator/agendas/${id}` },
    { label: 'Panitia', icon: 'i-heroicons-briefcase' }
]);

useHead({
    title: () => `${'Panitia'} - ${agenda.value?.title}`,
});
</script>

<template>
    <div class="mb-24 space-y-4">
        <UBreadcrumb :items="links" />

        <UCard class="px-0 py-0 sm:px-4 overflow-hidden" :ui="{ body: 'px-0 sm:p-6' }">
            <template #header>
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {{ 'Panitia' }}
                            <UBadge color="gray" variant="subtle" size="xs">{{ pageTotal }} Org</UBadge>
                        </h2>
                        <p class="text-sm text-gray-500 dark:text-gray-300 mt-1">Kelola data panitia dan volunteer event
                        </p>
                    </div>

                    <div class="flex gap-2" v-if="isCommittee">
                        <UButton :to="`/administrator/agendas/${id}/committee/add`" label="Tambah Manual"
                            icon="i-heroicons-plus" size="sm" color="white" />
                    </div>
                </div>
            </template>

            <div
                class="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex flex-col sm:flex-row justify-between items-center gap-3">
                <UInput v-model="search" icon="i-heroicons-magnifying-glass" placeholder="Cari Nama / NIM / Jabatan..."
                    class="w-full sm:w-72">
                    <template #trailing>
                        <UButton v-show="search !== ''" color="gray" variant="link" icon="i-heroicons-x-mark"
                            :padded="false" @click="search = ''" />
                    </template>
                </UInput>

                <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <UDropdownMenu v-if="isCommittee" :items="bulkActions" :popper="{ placement: 'bottom-end' }">
                        <UButton color="white" icon="i-heroicons-cog-6-tooth" trailing-icon="i-heroicons-chevron-down">
                            {{ selectedCommittee.length > 0 ? `${selectedCommittee.length} Terpilih` : 'Kelola Data' }}
                        </UButton>
                    </UDropdownMenu>

                    <UButton icon="i-heroicons-arrow-path" variant="ghost" color="gray" @click="refresh()"
                        :loading="pending" tooltip="Refresh Data" />
                </div>
            </div>

            <UTable ref="table" v-model:row-selection="selectedRows" :columns="columns" :data="members"
                :loading="pending" class="w-full">
                <template #empty-state>
                    <div class="flex flex-col items-center justify-center py-12 text-gray-400">
                        <UIcon name="i-heroicons-user-group" class="w-12 h-12 mb-3 opacity-20" />
                        <span class="text-sm">Belum ada data panitia</span>
                    </div>
                </template>
            </UTable>

            <div
                class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-100 dark:border-gray-800">
                <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
                    <span>Rows:</span>
                    <USelectMenu v-model="pagination.pageSize" :items="perPageOptions" size="xs" class="w-20" />
                </div>

                <UPagination v-model:page="pagination.pageIndex" :items-per-page="pagination.pageSize"
                    :total="pageTotal" :sibling-count="1" size="sm" />
            </div>
        </UCard>
    </div>
</template>