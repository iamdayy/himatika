<script setup lang="ts">
import { ModalsAchievementAdd, ModalsAchievementApprove } from '#components';
import type { SelectItem } from '@nuxt/ui';


definePageMeta({ layout: 'dashboard', middleware: ['sidebase-auth', 'organizer'] });
const { $api, $ts } = useNuxtApp();
const toast = useToast();
const overlay = useOverlay();

const addAchievementModal = overlay.create(ModalsAchievementAdd);
const ApproveModal = overlay.create(ModalsAchievementApprove);

const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);

const page = ref(1);
const perPage = ref(10);
const pageTotal = computed(() => requests.value?.length || 0);
const pageFrom = computed(() => page.value === 0 ? 0 : (page.value - 1) * perPage.value + 1);
const pageTo = computed(() => Math.min(page.value * perPage.value, pageTotal.value || 0));
const pageCountOptions = computed(() => [10, 20, 50, 100, 200, pageTotal.value || 0]);
const status = ref<'pending' | 'approved' | 'rejected'>();
const statusOptions = computed<SelectItem[]>(() => [
    { label: $ts('pending'), value: 'pending' },
    { label: $ts('approved'), value: 'approved' },
    { label: $ts('rejected'), value: 'rejected' }
]);

// Fetch Pending Requests
const { data: requests, refresh, pending } = useLazyAsyncData('pending-achievements',
    () => $api<any>('/api/admin/achievement', {
        query: { status: status.value }
    }),
    {
        watch: [status]
    }
);

// Helper untuk membuka modal
const openApprove = (req: any) => {
    ApproveModal.open({
        req: req,
        onSuccess: () => {
            refresh();
        }
    });
};

const openAddAchievementModal = () => {
    addAchievementModal.open({
        onSuccess: () => {
            refresh();
            addAchievementModal.close();
        }
    });
};


const rejectAchievement = async (id: string) => {
    try {
        await $api('/api/admin/achievement/decide', {
            method: 'POST',
            body: {
                id: id,
                action: 'reject',
                amount: 0,
                createNews: false,
            }
        });
        toast.add({ title: 'Status berhasil diperbarui', color: 'success' });
        refresh();
    } catch (e: any) {
        toast.add({ title: 'Gagal', description: e.message, color: 'error' });
    }
};

const links = computed(() => [{
    label: $ts('dashboard'),
    icon: 'i-heroicons-home',
    to: '/dashboard'
}, {


}]);
</script>

<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :links="links" />
        <UCard class="p-2 mt-2 md:p-4">
            <template #header>
                <div class="flex items-center justify-between">
                    <h1 class="text-2xl font-bold">Validasi Prestasi Masuk</h1>
                    <div class="flex items-center gap-2">
                        <USelect v-model="status" :items="statusOptions" :placeholder="$ts('status')" />
                        <UButton variant="ghost" @click="openAddAchievementModal">
                            Tambah Prestasi Baru
                        </UButton>
                    </div>
                </div>
            </template>
            <div class="space-y-6 mb-24">

                <div v-if="pending" class="space-y-4">
                    <UCard v-for="i in 3" :key="i">
                        <div class="flex flex-col md:flex-row gap-4 items-start">
                            <USkeleton class="w-full md:w-48 h-32 rounded-lg" />
                            <div class="flex-1 space-y-2">
                                <USkeleton class="h-6 w-1/3" />
                                <USkeleton class="h-4 w-1/4" />
                                <USkeleton class="h-16 w-full mt-2" />
                            </div>
                        </div>
                    </UCard>
                </div>

                <div v-else-if="requests?.length === 0"
                    class="text-center text-gray-500 py-10 border rounded-lg border-dashed">
                    Tidak ada pengajuan prestasi baru.
                </div>

                <UCard v-for="req in requests" :key="req._id">
                    <div class="flex flex-col md:flex-row gap-4 items-start">
                        <div
                            class="w-full md:w-48 h-32 bg-gray-100/20 dark:bg-gray-800/20 rounded-lg overflow-hidden flex-shrink-0 border">
                            <NuxtImg v-if="req.proof" :src="req.proof" class="w-full h-full object-cover" />
                            <div v-else class="flex items-center justify-center h-full text-gray-400 text-xs">No Image
                            </div>
                        </div>

                        <div class="flex-1">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h3 class="font-bold text-lg">{{ req.reason }}</h3>
                                    <p class="text-sm text-gray-500">{{ req.member?.fullName }} • {{ req.member?.NIM }}
                                    </p>
                                </div>
                                <UBadge :label="req.type" color="secondary" variant="subtle" />
                            </div>

                            <div class="mt-2 text-sm bg-gray-50/20 dark:bg-gray-900/20 dark:text-gray-400 p-2 rounded">
                                <CoreContent :content="req.description" size="sm" />
                            </div>
                            <p class="text-xs text-gray-400 mt-1">Diajukan: {{ new Date(req.date ||
                                req.createdAt).toLocaleDateString() }}</p>
                        </div>

                        <div class="flex flex-col gap-2 min-w-[100px]" v-if="req.status === 'pending'">
                            <UButton color="success" icon="i-heroicons-check" block @click="openApprove(req)">Proses
                            </UButton>
                            <UButton color="error" variant="soft" icon="i-heroicons-x-mark" block
                                @click="rejectAchievement(req._id)">Tolak</UButton>
                        </div>
                    </div>
                </UCard>
            </div>
            <template #footer>
                <div class="flex flex-col items-center justify-between gap-2 md:flex-row">
                    <div class="flex items-center gap-1.5 mb-2 sm:mb-0">
                        <span class="text-sm leading-5">Rows per page:</span>
                        <USelect v-model="perPage" :items="pageCountOptions" class="w-20 me-2" size="xs" />
                    </div>
                    <div class="mb-2 sm:mb-0">
                        <span class="text-sm leading-5">
                            Showing
                            <span class="font-medium">{{ pageFrom }}</span>
                            to
                            <span class="font-medium">{{ pageTo }}</span>
                            of
                            <span class="font-medium">{{ pageTotal }}</span>
                            results
                        </span>
                    </div>
                    <div class="flex items-center gap-3">
                        <UPagination v-model:page="page" :items-per-page="perPage" :total="pageTotal"
                            :sibling-count="isMobile ? 2 : 6" />
                    </div>
                </div>
            </template>
        </UCard>
    </div>
</template>