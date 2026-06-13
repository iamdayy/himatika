<script setup lang="ts">
const props = defineProps<{
    req: any;
}>();

const emit = defineEmits(['close', 'success']);

const toast = useToast();
const { $api } = useNuxtApp();

const approvalForm = reactive({
    id: props.req._id,
    amount: 10,
    createNews: true,
    newsTitle: '',
    newsBody: ''
});

const isSubmitting = ref(false);

onMounted(() => {
    const memberName = props.req.member?.fullName || 'Anggota';
    approvalForm.newsTitle = `Membanggakan! ${memberName} Meraih ${props.req.reason}`;
    approvalForm.newsBody = `<p>Kabar gembira datang dari salah satu anggota kita, <strong>${memberName}</strong>.</p>
<p>Berdasarkan laporan prestasi yang masuk, beliau berhasil meraih pencapaian sebagai <strong>${props.req.reason}</strong>.</p>
<p><em>"${props.req.description || ''}"</em></p>
<p>Semoga prestasi ini dapat memotivasi anggota lain!</p>`;
});

const approve = async () => {
    isSubmitting.value = true;
    try {
        await $api('/api/admin/achievement/decide', {
            method: 'POST',
            body: {
                id: approvalForm.id,
                action: 'approve',
                amount: approvalForm.amount,
                createNews: approvalForm.createNews,
                newsTitle: approvalForm.newsTitle,
                newsBody: approvalForm.newsBody
            }
        });
        toast.add({ title: 'Status berhasil diperbarui', color: 'success' });
        emit('success');
        emit('close');
    } catch (e: any) {
        toast.add({ title: 'Gagal', description: e.message, color: 'error' });
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <UModal @close="$emit('close')">
        <template #header>
            <h3 class="font-bold text-lg">Persetujuan Prestasi</h3>
        </template>
        <template #body>
            <div class="space-y-5 max-h-[70vh] overflow-y-auto px-1">
                <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <UFormField label="Berikan Poin Reward"
                        help="Nilai poin yang akan masuk ke akumulasi member">
                        <UInput type="number" v-model="approvalForm.amount" size="lg">
                            <template #leading><span class="text-xs font-bold text-gray-500">PTS</span></template>
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
                <UButton variant="ghost" @click="$emit('close')">Batal</UButton>
                <UButton @click="approve" :loading="isSubmitting">
                    {{ approvalForm.createNews ? 'Simpan Poin & Terbitkan Berita' : 'Simpan Poin Saja' }}
                </UButton>
            </div>
        </template>
    </UModal>
</template>
