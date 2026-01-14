<script setup lang="ts">
import { format } from 'date-fns';
import { CustomFormData } from '~/helpers/CustomFormData';
import type { IPointLog } from '~~/types';

const emit = defineEmits(['close', 'success']);
const { $api } = useNuxtApp();
const sizes = useResponsiveUiSizes();
const toast = useToast();

const loading = ref(false);
const form = reactive({
    title: '', // Juara 1 Web Design
    desc: '',
    type: 'achievement',
    date: new Date(),
    file: null as File | null
});

const submit = async () => {
    if (!form.title || !form.file) {
        toast.add({ title: 'Isi semua field yang diperlukan', color: 'warning' });
        return;
    }

    loading.value = true;
    try {
        const formData = new CustomFormData<IPointLog & { file: File }>();
        formData.append('reason', form.title);
        formData.append('description', form.desc);
        formData.append('type', form.type);
        formData.append('date', form.date.toDateString());
        formData.append('file', form.file!);

        await $api('/api/me/achievement/claim', {
            method: 'POST',
            body: formData.getFormData()
        });

        toast.add({ title: 'Klaim terkirim!', description: 'Menunggu validasi admin', color: 'success' });
        emit('success');
        emit('close');
    } catch (e: any) {
        toast.add({ title: 'Gagal', description: e.statusMessage, color: 'error' });
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <UModal prevent-close>
        <template #header>
            <h3 class="font-semibold">Klaim Prestasi / Aktivitas</h3>
        </template>
        <template #body>
            <div class="space-y-4">
                <UFormField label="Judul Prestasi" required>
                    <UInput v-model="form.title" placeholder="Contoh: Juara 2 Lomba UI/UX Gemastik" />
                </UFormField>

                <div class="grid grid-cols-2 gap-4">
                    <UFormField label="Kategori">
                        <USelectMenu v-model="form.type" :items="['achievement', 'activity']" class="w-full" />
                    </UFormField>
                    <UFormField label="Tanggal">
                        <UPopover :popper="{ placement: 'bottom-start', strategy: 'absolute' }">
                            <UButton icon="i-heroicons-calendar-days-20-solid" :size="sizes.button" color="neutral"
                                variant="outline" class="w-full">
                                {{ format(form.date as Date, 'd MMM, yyy') }}
                            </UButton>
                            <template #content>
                                <div class="flex items-center divide-gray-200 sm:divide-x dark:divide-gray-800">
                                    <DatePicker v-model="form.date" />
                                </div>
                            </template>
                        </UPopover>
                    </UFormField>
                </div>

                <UFormField label="Bukti (Sertifikat/Foto)" required>
                    <UFileUpload v-model="form.file" accept="image/*" />
                </UFormField>

                <UFormField label="Deskripsi Tambahan">
                    <UTextarea v-model="form.desc" placeholder="Ceritakan sedikit tentang pencapaian ini..." />
                </UFormField>
            </div>
        </template>

        <template #footer>
            <div class="flex justify-end gap-2">
                <UButton variant="ghost" @click="$emit('close')">Batal</UButton>
                <UButton :loading="loading" @click="submit">Kirim Klaim</UButton>
            </div>
        </template>
    </UModal>
</template>