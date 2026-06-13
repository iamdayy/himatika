<script setup lang="ts">
import type { IResponse } from '~~/types/IResponse';

definePageMeta({
    middleware: ["sidebase-auth", 'organizer', 'committee'],
    layout: 'dashboard',
});

const route = useRoute();
const { id } = route.params as { id: string };
const toast = useToast();
const { $api, $ts } = useNuxtApp();

const { data: agenda } = useLazyAsyncData(`agenda-${id}`, () => $api<any>(`/api/agenda/${id}`), {
    transform: (res) => res.data?.agenda,
});

const { data: verifyingList, pending, refresh } = useLazyAsyncData(`verifying-${id}`, () => $api<any>(`/api/agenda/${id}/payment/verifying`), {
    transform: (res) => res.data?.verifying || [],
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

const columns = [
    { key: 'name', label: 'Nama Lengkap' },
    { key: 'type', label: 'Tipe' },
    { key: 'manual_target', label: 'Tujuan Transfer' },
    { key: 'proof_url', label: 'Bukti Pembayaran' },
    { key: 'time', label: 'Waktu' },
    { key: 'actions', label: 'Aksi' }
];

const selectedProof = ref('');
const isProofModalOpen = ref(false);

const openProof = (url: string) => {
    selectedProof.value = url;
    isProofModalOpen.value = true;
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
                                Daftar peserta/panitia yang sudah mengunggah bukti transfer manual dan menunggu persetujuan Anda.
                            </p>
                        </div>
                    </div>
                </template>

                <UTable :columns="columns" :rows="verifyingList" :loading="pending">
                    <template #type-data="{ row }">
                        <UBadge :color="row.type === 'committee' ? 'purple' : 'blue'" variant="subtle">
                            {{ row.type === 'committee' ? 'Kepanitiaan' : 'Peserta' }}
                        </UBadge>
                    </template>
                    <template #manual_target-data="{ row }">
                        <span class="font-medium">{{ row.payment?.manual_target }}</span>
                    </template>
                    <template #proof_url-data="{ row }">
                        <UButton size="xs" color="gray" variant="soft" icon="i-heroicons-photo" @click="openProof(row.payment?.proof_url)">
                            Lihat Gambar
                        </UButton>
                    </template>
                    <template #time-data="{ row }">
                        <span class="text-xs text-gray-500">{{ new Date(row.payment?.time).toLocaleString() }}</span>
                    </template>
                    <template #actions-data="{ row }">
                        <div class="flex items-center gap-2">
                            <UButton size="xs" color="success" icon="i-heroicons-check" :loading="isSubmitting" @click="handleVerify(row._id, 'success')">Sah</UButton>
                            <UButton size="xs" color="error" icon="i-heroicons-x-mark" :loading="isSubmitting" @click="handleVerify(row._id, 'failed')">Tolak</UButton>
                        </div>
                    </template>
                    
                    <template #empty-state>
                        <div class="flex flex-col items-center justify-center py-12">
                            <UIcon name="i-heroicons-inbox" class="w-12 h-12 text-gray-300 mb-4" />
                            <p class="text-gray-500 text-sm">Tidak ada pembayaran yang butuh diverifikasi saat ini.</p>
                        </div>
                    </template>
                </UTable>
            </UCard>
        </div>

        <UModal v-model="isProofModalOpen">
            <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
                <template #header>
                    <div class="flex items-center justify-between">
                        <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                            Bukti Transfer
                        </h3>
                        <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isProofModalOpen = false" />
                    </div>
                </template>
                <div class="flex justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <img :src="selectedProof" alt="Bukti Transfer" class="max-w-full max-h-[70vh] object-contain rounded-md" />
                </div>
            </UCard>
        </UModal>
    </div>
</template>
