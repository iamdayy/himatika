<script setup lang="ts">
import { ModalsAchievementClaim, ModalsConfirmation, UBadge, UBreadcrumb, UButton } from '#components';
import type { TableColumn } from '@nuxt/ui';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { IPointLog } from '~~/types';

const UDropdownMenu = resolveComponent('UDropdownMenu');

definePageMeta({
    layout: 'dashboard'
});

const { $api } = useNuxtApp();
const overlay = useOverlay();
const toast = useToast();

const ClaimModalComponent = overlay.create(ModalsAchievementClaim);
const ConfirmationModalComponent = overlay.create(ModalsConfirmation);

// Fetch data achievement dari API yang baru kita buat
const { data: achievements, refresh, status } = await useAsyncData('achievement-me', () => $api<IPointLog[]>('/api/me/achievement'));

const links = [
    {
        label: 'Dashboard',
        icon: 'i-heroicons-home',
        to: '/dashboard'
    },
    {
        label: 'Prestasi & Aktivitas',
        icon: 'i-heroicons-trophy'
    }
];

const columns = computed<TableColumn<IPointLog>[]>(() => [
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
        accessorKey: 'date',
        header: 'Tanggal',
        size: 150,
        cell: ({ row }) => format(row.original.date || new Date(), 'dd MMMM yyyy', { locale: id }),
    },
    {
        accessorKey: 'type',
        header: 'Tipe',
        size: 100,
        cell: ({ row }) => translateType(row.original.type || 'achievement'),
    },
    {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        cell: ({ row }) => {
            return h(UBadge, {
                color: getStatusColor(row.original.status || 'pending'),
                size: 'xs',
                variant: 'solid',
                label: row.original.status || 'pending',
            });
        },
    },
    {
        accessorKey: 'amount',
        header: 'Poin',
        size: 100,
    },
    {
        accessorKey: 'proof',
        header: 'Bukti',
        size: 100,
        cell: ({ row }) => {
            return h(UButton, {
                color: 'neutral',
                variant: 'ghost',
                icon: 'i-heroicons-document-text',
                size: 'xs',
                to: row.original.proof,
                target: '_blank'
            });
        }
    },
    {
        accessorKey: 'actions',
        header: 'Aksi',
        size: 100,
        cell: ({ row }) => {
            const items = [
                [{
                    label: 'Edit',
                    icon: 'i-heroicons-pencil-square',
                    onClick: () => handleEdit(row.original)
                }, {
                    label: 'Hapus',
                    icon: 'i-heroicons-trash',
                    color: 'error' as const,
                    onClick: () => handleDelete(row.original)
                }]
            ];

            return h(UDropdownMenu, {
                items,
            }, {
                default: () => h(UButton, {
                    color: 'neutral',
                    variant: 'ghost',
                    icon: 'i-heroicons-ellipsis-horizontal',
                    size: 'xs'
                })
            });
        }
    }
])

function getStatusColor(status: string) {
    switch (status) {
        case 'approved': return 'success';
        case 'rejected': return 'error';
        default: return 'neutral';
    }
}

function translateType(type: string) {
    return type === 'achievement' ? 'Prestasi' : 'Aktivitas';
}

function openClaimModal() {
    ClaimModalComponent.open({
        onSuccess: () => {
            refresh();
            ClaimModalComponent.close();
        }
    });
}

function handleEdit(item: IPointLog) {
    ClaimModalComponent.open({
        initialData: item,
        onSuccess: () => {
            refresh();
            ClaimModalComponent.close();
        }
    });
}

function handleDelete(item: IPointLog) {
    ConfirmationModalComponent.open({
        title: 'Hapus Prestasi?',
        body: 'Apakah Anda yakin ingin menghapus prestasi ini? Data yang dihapus tidak dapat dikembalikan.',
        onConfirm: async () => {
            try {
                await $api(`/api/me/achievement/${item._id}`, {
                    method: 'DELETE'
                });
                toast.add({ title: 'Berhasil', description: 'Prestasi berhasil dihapus', color: 'success' });
                refresh();
                ConfirmationModalComponent.close();
            } catch (e: any) {
                toast.add({ title: 'Gagal', description: e.statusMessage || 'Gagal menghapus', color: 'error' });
            }
        },
        onClose: () => {
            ConfirmationModalComponent.close();
        }
    });
}
</script>

<template>
    <div class="space-y-6">
        <UBreadcrumb :links="links" />

        <UCard>
            <template #header>
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold">Prestasi & Aktivitas</h1>
                        <p class="text-gray-500">Daftar riwayat pencapaian dan aktivitas Anda.</p>
                    </div>
                    <UButton icon="i-heroicons-plus" @click="openClaimModal">Klaim Baru</UButton>
                </div>
            </template>
            <UTable :data="achievements" :columns="columns" :loading="status === 'pending'">
                <template #empty-state>
                    <div class="flex flex-col items-center justify-center py-12 gap-4">
                        <div class="p-4 rounded-full bg-gray-100 dark:bg-gray-800">
                            <UIcon name="i-heroicons-trophy" class="w-10 h-10 text-gray-400" />
                        </div>
                        <div class="text-center">
                            <p class="font-medium">Belum ada data</p>
                            <p class="text-sm text-gray-500">Anda belum memiliki riwayat prestasi atau aktivitas.</p>
                        </div>
                    </div>
                </template>
            </UTable>
        </UCard>
    </div>
</template>
