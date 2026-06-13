<script setup lang="ts">
import { ModalsImageOpen, UBadge, UButton, UCheckbox } from '#components';
import type { TableColumn } from '@nuxt/ui';
import type { Column } from '@tanstack/vue-table';
import type { IPaymentVerification } from '~~/types';
import type { IAgendaResponse, IPaymentVerificationResponse, IResponse } from '~~/types/IResponse';

definePageMeta({
    middleware: ["sidebase-auth", 'organizer', 'committee'],
    layout: 'dashboard',
});

const route = useRoute();
const { id } = route.params as { id: string };
const toast = useToast();
const { $api, $ts } = useNuxtApp();
const overlay = useOverlay();
const ImageModal = overlay.create(ModalsImageOpen);

const sort = ref({
    column: 'name',
    direction: 'asc'
});

const { data: agenda } = useLazyAsyncData(`agenda-${id}`, () => $api<IAgendaResponse>(`/api/agenda/${id}`), {
    transform: (res) => res.data?.agenda,
});

const { data: verifyingList, pending, refresh } = useLazyAsyncData(`verifying-${id}`, () => $api<IPaymentVerificationResponse>(`/api/agenda/${id}/payment/verifying`), {
    transform: (res) => res.data?.verifyingList || [],
    default: () => [],
});

const isSubmitting = ref(false);

const handleVerify = async (registeredId: string, status: 'success' | 'failed') => {
    isSubmitting.value = true;
    try {
        const res = await $api<IResponse>(`/api/agenda/${id}/payment/verify`, {
            method: 'POST',
            body: { registeredId, status }
        });

        if (res.statusCode === 200) {
            toast.add({ title: 'Berhasil', description: `Pembayaran berhasil di${status === 'success' ? 'terima' : 'tolak'}`, color: 'success' });
            refresh();
        }
    } catch (err: any) {
        toast.add({ title: 'Gagal', description: err.response?.data?.statusMessage || 'Gagal memverifikasi', color: 'error' });
    } finally {
        isSubmitting.value = false;
    }
};

function addSortButton(column: Column<IPaymentVerification>, label: string) {
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

const columns: TableColumn<IPaymentVerification>[] = [
    {
        id: 'select',
        header: ({ table }) => h(UCheckbox, {
            modelValue: table.getIsSomePageRowsSelected()
                ? 'indeterminate'
                : table.getIsAllPageRowsSelected(),
            'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
                table.toggleAllPageRowsSelected(!!value),
            'aria-label': 'Select all'
        }),
        cell: ({ row }) => h(UCheckbox, {
            modelValue: row.getIsSelected(),
            'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
            'aria-label': 'Select row'
        })
    },
    {
        id: 'id',
        accessorKey: 'id',
        header: '#',
        size: 50,
        enableSorting: false,
        enableResizing: false,
        cell: ({ row }) => row.index + 1,
    },
    {
        id: 'name',
        accessorKey: 'name',
        header: ({ column }) => addSortButton(column, $ts('name')),
        size: 100,
    },
    {
        id: 'email',
        accessorKey: 'email',
        header: ({ column }) => addSortButton(column, $ts('email')),
        size: 100,
    },
    {
        id: 'type',
        accessorKey: 'type',
        header: ({ column }) => addSortButton(column, $ts('type')),
        size: 100,
        cell: ({ row }) => {
            return h(UBadge, { color: row.original.type === 'committee' ? 'neutral' : 'info', variant: 'subtle' }, row.original.type === 'committee' ? 'Kepanitiaan' : 'Peserta');
        }
    },
    {
        id: 'manual_target',
        header: ({ column }) => addSortButton(column, $ts('manual_target')),
        cell: ({ row }) => {
            const payment = row.original.payment;
            return payment?.manual_target;
        },
        size: 100,
    },
    {
        id: 'proof_url',
        header: ({ column }) => addSortButton(column, $ts('proof_url')),
        size: 100,
        cell: ({ row }) => {
            return h(UButton, { icon: 'i-heroicons-eye', color: 'info', size: 'xs', onClick: () => openProof(row.original.payment?.proof_url) }, $ts('view'));
        }
    },
    {
        id: 'time',
        accessorKey: 'time',
        header: ({ column }) => addSortButton(column, $ts('time')),
        size: 100,
        cell: ({ row }) => {
            return h('span', { class: 'text-xs text-gray-500' }, new Date(row.original.payment?.time || '').toLocaleString());
        }
    },
    {
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-2' }, [
                h(UButton, { icon: 'i-heroicons-check', color: 'success', size: 'xs', loading: isSubmitting.value, onClick: () => handleVerify(row.original._id, 'success') }, 'Sah'),
                h(UButton, { icon: 'i-heroicons-x-mark', color: 'error', size: 'xs', loading: isSubmitting.value, onClick: () => handleVerify(row.original._id, 'failed') }, 'Tolak')
            ]);
        }
    }
];

const openProof = (url: string | undefined | null) => {
    if (url) {
        ImageModal.open({
            photo: {
                image: url,
                tags: ['Bukti Transfer'],
                archived: false,
            }
        });
    }
};

const links = computed(() => [
    { label: $ts('dashboard'), to: '/dashboard', icon: 'i-heroicons-home' },
    { label: $ts('agenda'), to: '/dashboard/agendas', icon: 'i-heroicons-clipboard-document-list' },
    { label: agenda.value?.title || '', to: `/agendas/${id}`, icon: 'i-heroicons-document' },
    { label: 'Verifikasi Pembayaran', icon: 'i-heroicons-check-badge' },
]);
</script>

<template>
    <div class="mb-24">
        <UBreadcrumb :items="links" />
        <div class="mt-6">
            <UCard>
                <template #header>
                    <div class="flex justify-between items-center">
                        <div>
                            <h2 class="text-xl font-bold flex items-center gap-2">
                                <UIcon name="i-heroicons-check-badge" class="text-primary" />
                                Verifikasi Transfer Manual
                            </h2>
                            <p class="text-sm text-gray-500 mt-1">
                                Daftar peserta/panitia yang sudah mengunggah bukti transfer manual dan menunggu
                                persetujuan Anda.
                            </p>
                        </div>
                    </div>
                </template>

                <UTable :columns="columns" :data="verifyingList" :loading="pending">
                    <template #empty-state>
                        <div class="flex flex-col items-center justify-center py-12">
                            <UIcon name="i-heroicons-inbox" class="w-12 h-12 text-gray-300 mb-4" />
                            <p class="text-gray-500 text-sm">Tidak ada pembayaran yang butuh diverifikasi saat ini.</p>
                        </div>
                    </template>
                </UTable>
            </UCard>
        </div>
    </div>
</template>
