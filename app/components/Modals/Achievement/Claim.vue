<script setup lang="ts">
import { format } from 'date-fns';
import { CustomFormData } from '~/helpers/CustomFormData';
import type { IPointLog } from '~~/types';

const props = defineProps<{
    initialData?: IPointLog | null
}>();

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

// Prefill form if editing
onMounted(() => {
    if (props.initialData) {
        form.title = props.initialData.reason || '';
        form.desc = props.initialData.description || '';
        form.type = props.initialData.type || 'achievement';
        form.date = props.initialData.date ? new Date(props.initialData.date) : new Date();
        // file cannot be prefilled, but we can detect if we are in edit mode
    }
});

const submit = async () => {
    // Validation
    if (!form.title) {
        toast.add({ title: 'Judul wajib diisi', color: 'warning' });
        return;
    }
    // If creating new, file is required. If editing, file is optional (keep old one).
    if (!props.initialData && !form.file) {
        toast.add({ title: 'Bukti wajib diupload', color: 'warning' });
        return;
    }

    loading.value = true;
    try {
        const formData = new CustomFormData<IPointLog & { file?: File }>();
        formData.append('reason', form.title);
        formData.append('description', form.desc);
        formData.append('type', form.type);
        formData.append('date', form.date.toDateString());
        if (form.file) {
            formData.append('file', form.file);
        }

        if (props.initialData) {
            // Update
            await $api(`/api/me/achievement/${props.initialData._id}`, {
                method: 'PUT',
                body: formData.getFormData()
            });
            toast.add({ title: 'Prestasi diperbarui!', description: 'Menunggu validasi ulang admin', color: 'success' });
        } else {
            // Create
            await $api('/api/me/achievement/claim', {
                method: 'POST',
                body: formData.getFormData()
            });
            toast.add({ title: 'Klaim terkirim!', description: 'Menunggu validasi admin', color: 'success' });
        }

        emit('success');
        emit('close');
    } catch (e: any) {
        toast.add({ title: 'Gagal', description: e.statusMessage || 'Terjadi kesalahan', color: 'error' });
    } finally {
        loading.value = false;
    }

};
</script>

<template>
    <UModal prevent-close>
        <template #header>
            <h3 class="font-semibold">{{ initialData ? 'Edit' : 'Klaim' }} Prestasi / Aktivitas</h3>
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

                <UFormField :label="initialData ? 'Ubah Bukti (Opsional)' : 'Bukti (Sertifikat/Foto)'"
                    :required="!initialData">
                    <UFileUpload v-model="form.file" accept="image/*" />
                    <p v-if="initialData?.proof" class="text-xs text-gray-500 mt-1">
                        File saat ini: <a :href="initialData.proof" target="_blank"
                            class="text-primary hover:underline">Lihat Bukti</a>
                    </p>
                </UFormField>

                <UFormField label="Deskripsi Tambahan">
                    <CoreTiptap v-model="form.desc" />
                </UFormField>
            </div>
        </template>

        <template #footer>
            <div class="flex justify-between gap-2 w-full">
                <UButton variant="ghost" @click="$emit('close')">Batal</UButton>
                <UButton :loading="loading" @click="submit">{{ initialData ? 'Simpan Perubahan' : 'Kirim Klaim' }}
                </UButton>
            </div>
        </template>
    </UModal>
</template>
