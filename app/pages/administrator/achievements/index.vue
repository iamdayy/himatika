<script setup lang="ts">
import { ModalsAchievementAdd } from '#components';
import type { SelectItem } from '@nuxt/ui';


definePageMeta({ layout: 'dashboard', middleware: ['sidebase-auth', 'organizer'] });
const { $api, $ts } = useNuxtApp();
const toast = useToast();
const overlay = useOverlay();

const addAchievementModal = overlay.create(ModalsAchievementAdd);

const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);

const page = ref(1);
const perPage = ref(10);
const pageTotal = computed(() => requests.value?.length || 0);
const pageFrom = computed(() => (page.value - 1) * perPage.value + 1);
const pageTo = computed(() => Math.min(page.value * perPage.value, pageTotal.value || 0));
const pageCountOptions = computed(() => [10, 20, 50, 100, 200, pageTotal.value || 0]);
const status = ref<'pending' | 'approved' | 'rejected'>();
const statusOptions = computed<SelectItem[]>(() => [
    { label: $ts('pending'), value: 'pending' },
    { label: $ts('approved'), value: 'approved' },
    { label: $ts('rejected'), value: 'rejected' }
]);

// Fetch Pending Requests
const { data: requests, refresh, pending } = await useAsyncData('pending-achievements',
    () => $api<any>('/api/admin/achievement', {
        query: { status: status.value }
    }),
    {
        watch: [status]
    }
);

// State Form Approval
const approvalForm = reactive({
    id: '',
    amount: 10,
    isOpen: false,

    // Opsi Berita
    createNews: true, // Default ON
    newsTitle: '',
    newsBody: ''
});

// Helper untuk membuka modal dan PRE-FILL data berita
const openApprove = (req: any) => {
    approvalForm.id = req._id;
    approvalForm.amount = 10;
    approvalForm.isOpen = true;
    approvalForm.createNews = true;

    // Auto-generate Draft (Bisa diedit admin)
    const memberName = req.member?.fullName || 'Anggota';
    approvalForm.newsTitle = `Membanggakan! ${memberName} Meraih ${req.reason}`;
    approvalForm.newsBody = `<p>Kabar gembira datang dari salah satu anggota kita, <strong>${memberName}</strong>.</p>
<p>Berdasarkan laporan prestasi yang masuk, beliau berhasil meraih pencapaian sebagai <strong>${req.reason}</strong>.</p>
<p><em>"${req.description || ''}"</em></p>
<p>Semoga prestasi ini dapat memotivasi anggota lain!</p>`;
};

const openAddAchievementModal = () => {
    addAchievementModal.open({
        onSuccess: () => {
            refresh();
            addAchievementModal.close();
        }
    });
};


const decide = async (action: 'approve' | 'reject') => {
    try {
        await $api('/api/admin/achievement/decide', {
            method: 'POST',
            body: {
                id: approvalForm.id,
                action,
                amount: action === 'approve' ? approvalForm.amount : 0,

                // Kirim data berita kustom jika diapprove
                createNews: action === 'approve' ? approvalForm.createNews : false,
                newsTitle: approvalForm.newsTitle,
                newsBody: approvalForm.newsBody
            }
        });
        toast.add({ title: 'Status berhasil diperbarui', color: 'success' });
        approvalForm.isOpen = false;
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

                <div v-if="pending" class="text-center py-10">
                    <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
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

                            <p class="mt-2 text-sm bg-gray-50/20 dark:bg-gray-900/20 dark:text-gray-400 p-2 rounded">{{
                                req.description }}</p>
                            <p class="text-xs text-gray-400 mt-1">Diajukan: {{ new Date(req.date ||
                                req.createdAt).toLocaleDateString() }}</p>
                        </div>

                        <div class="flex flex-col gap-2 min-w-[100px]" v-if="req.status === 'pending'">
                            <UButton color="success" icon="i-heroicons-check" block @click="openApprove(req)">Proses
                            </UButton>
                            <UButton color="error" variant="soft" icon="i-heroicons-x-mark" block
                                @click="approvalForm.id = req._id; decide('reject')">Tolak</UButton>
                        </div>
                    </div>
                </UCard>

                <UModal v-model:open="approvalForm.isOpen">
                    <template #header>
                        <h3 class="font-bold text-lg">Persetujuan Prestasi</h3>
                    </template>
                    <template #body>
                        <div class="space-y-5 max-h-[70vh] overflow-y-auto px-1">
                            <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <UFormField label="Berikan Poin Reward"
                                    help="Nilai poin yang akan masuk ke akumulasi member">
                                    <UInput type="number" v-model="approvalForm.amount" size="lg">
                                        <template #leading><span
                                                class="text-xs font-bold text-gray-500">PTS</span></template>
                                    </UInput>
                                </UFormField>
                            </div>

                            <USeparator />

                            <div class="flex items-center justify-between">
                                <div class="text-sm">
                                    <p class="font-semibold">Terbitkan Berita Otomatis?</p>
                                    <p class="text-gray-500 text-xs">Jadikan ini konten di halaman Berita</p>
                                </div>
                                <USwitch v-model="approvalForm.createNews" />
                            </div>

                            <div v-if="approvalForm.createNews" class="space-y-4 border-l-2 border-primary pl-4 ml-1">
                                <UFormField label="Judul Berita">
                                    <UInput v-model="approvalForm.newsTitle" />
                                </UFormField>

                                <UFormField label="Isi Berita (HTML)">
                                    <CoreTiptap v-model="approvalForm.newsBody" />
                                </UFormField>
                            </div>
                        </div>
                    </template>

                    <template #footer>
                        <div class="flex justify-between gap-2 w-full items-center">
                            <UButton variant="ghost" @click="approvalForm.isOpen = false">Batal</UButton>
                            <UButton @click="decide('approve')" :loading="pending">
                                {{ approvalForm.createNews ? 'Simpan Poin & Terbitkan Berita' : 'Simpan Poin Saja' }}
                            </UButton>
                        </div>
                    </template>
                </UModal>
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