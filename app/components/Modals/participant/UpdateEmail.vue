<script setup lang="ts">
const props = defineProps<{
    initialEmail: string;
    agendaId: string;
    participantId: string;
}>();

const emit = defineEmits(['close', 'success']);

const toast = useToast();
const { $api } = useNuxtApp();

const newEmail = ref(props.initialEmail);
const isUpdatingEmail = ref(false);

const updateEmail = async () => {
    if (!newEmail.value) {
        toast.add({ title: 'Gagal', description: 'Email tidak boleh kosong', color: 'error' });
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.value)) {
        toast.add({ title: 'Gagal', description: 'Format email tidak valid', color: 'error' });
        return;
    }

    isUpdatingEmail.value = true;
    try {
        await $api(`/api/agenda/${props.agendaId}/participant/register/${props.participantId}/email`, {
            method: 'PUT',
            body: { email: newEmail.value }
        });
        toast.add({ title: 'Berhasil', description: 'Email berhasil diperbarui', color: 'success' });
        emit('success', newEmail.value);
        emit('close');
    } catch (e: any) {
        toast.add({ title: 'Gagal', description: e.data?.statusMessage || e.message || 'Gagal mengubah email', color: 'error' });
    } finally {
        isUpdatingEmail.value = false;
    }
};
</script>

<template>
    <UModal @close="$emit('close')">
        <template #body>
            <div class="flex flex-col items-center">
                <div class="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-500 rounded-full flex items-center justify-center mb-4">
                    <UIcon name="i-heroicons-envelope" class="w-10 h-10" />
                </div>
                <div class="w-full">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Ubah Email</h3>
                    <p class="text-gray-500 dark:text-gray-400 text-center mb-4 text-sm">
                        Masukkan email baru yang aktif untuk menerima e-ticket.
                    </p>
                    <UInput v-model="newEmail" type="email" placeholder="Email Baru" size="lg"
                        icon="i-heroicons-envelope" />
                </div>
            </div>
        </template>
        <template #footer>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <UButton color="neutral" variant="soft" @click="$emit('close')" class="justify-center flex-1">
                    Batal
                </UButton>
                <UButton color="primary" @click="updateEmail" :loading="isUpdatingEmail" class="justify-center flex-1">
                    Simpan Email
                </UButton>
            </div>
        </template>
    </UModal>
</template>
