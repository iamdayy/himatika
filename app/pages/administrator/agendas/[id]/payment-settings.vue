<script setup lang="ts">
import type { IAgendaConfiguration, IPaymentMethod } from '~~/types';
import type { IAgendaResponse, IResponse } from '~~/types/IResponse';

definePageMeta({
    middleware: ["sidebase-auth", 'organizer', 'committee'],
    layout: 'dashboard',
});

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { $api, $ts } = useNuxtApp();

const { id } = route.params as { id: string };

const { data: agenda, pending: pendingAgenda, refresh } = useLazyAsyncData(`agenda-${id}`, async () => $api<IAgendaResponse>(`/api/agenda/${id}`), {
    transform: (data) => data.data?.agenda,
});

const configurationState = reactive<IAgendaConfiguration>({
    canSee: 'Public',
    canSeeRegistered: 'Public',
    committee: {} as any,
    participant: {} as any,
    manualPayments: [],
    allowedPaymentMethods: ['cash', 'bank_transfer', 'qris', 'manual_transfer'],
});

watch(agenda, (newAgenda) => {
    if (newAgenda?.configuration) {
        Object.assign(configurationState, newAgenda.configuration);
        if (!configurationState.manualPayments) {
            configurationState.manualPayments = [];
        }
        if (!configurationState.allowedPaymentMethods || configurationState.allowedPaymentMethods.length === 0) {
            configurationState.allowedPaymentMethods = ['cash', 'bank_transfer', 'qris', 'manual_transfer'];
        }
    }
}, { immediate: true });

const togglePaymentMethod = (method: IPaymentMethod, enabled: any) => {
    const isEnabled = !!enabled;
    if (!configurationState.allowedPaymentMethods) configurationState.allowedPaymentMethods = [];
    if (isEnabled) {
        if (!configurationState.allowedPaymentMethods.includes(method)) {
            configurationState.allowedPaymentMethods.push(method);
        }
    } else {
        configurationState.allowedPaymentMethods = configurationState.allowedPaymentMethods.filter(m => m !== method);
    }
}
const isMethodEnabled = (method: IPaymentMethod) => {
    return configurationState.allowedPaymentMethods?.includes(method) ?? false;
}

const loading = ref(false);

const removePayment = (index: number) => {
    if (configurationState.manualPayments) {
        configurationState.manualPayments.splice(index, 1);
    }
}

const addPayment = () => {
    if (!configurationState.manualPayments) configurationState.manualPayments = [];
    configurationState.manualPayments.push({ name: '', account: '', owner: '', instructions: '' });
}

async function onSubmit() {
    loading.value = true;
    try {
        const payload = {
            ...agenda.value,
            configuration: configurationState
        };
        const response = await $api<IResponse & { data?: { id: string } }>('api/agenda', {
            method: 'PUT',
            query: { id },
            body: payload,
        });
        if (response.statusCode === 200) {
            toast.add({
                title: $ts('success'), description: 'Pengaturan pembayaran manual berhasil diperbarui', color: 'success'
            });
            refresh();
        } else {
            toast.add({
                title: $ts('failed'), description: 'Gagal memperbarui pengaturan pembayaran', color: 'error'
            });
        }
    } catch (err: any) {
        toast.add({ title: err.response?.data?.message || $ts('something_went_wrong'), color: 'error' });
    } finally {
        loading.value = false;
    }
};

const links = computed(() => [
    { label: $ts('dashboard'), to: '/dashboard', icon: 'i-heroicons-home' },
    { label: $ts('agenda'), to: '/administrator/agendas', icon: 'i-heroicons-clipboard-document-list' },
    { label: agenda.value?.title || '', to: `/administrator/agendas/${id}`, icon: 'i-heroicons-document' },
    { label: 'Metode Pembayaran Manual', icon: 'i-heroicons-credit-card' },
]);
</script>

<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :items="links" />

        <div v-if="pendingAgenda" class="space-y-4 mt-6">
            <USkeleton class="h-12 w-full" />
            <UCard>
                <div class="space-y-4">
                    <USkeleton class="h-10 w-full" />
                    <USkeleton class="h-10 w-1/2" />
                    <USkeleton class="h-32 w-full" />
                </div>
            </UCard>
        </div>

        <div v-else class="mt-6">
            <UCard>
                <template #header>
                    <div class="flex justify-between items-center">
                        <div>
                            <h2 class="text-xl font-bold flex items-center gap-2">
                                <UIcon name="i-heroicons-adjustments-horizontal" class="text-primary" />
                                Pengaturan Metode Pembayaran
                            </h2>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Pilih metode pembayaran yang akan ditampilkan kepada peserta saat mendaftar.</p>
                        </div>
                    </div>
                </template>
                
                <div class="space-y-4 mb-8">
                    <UCheckbox :model-value="isMethodEnabled('cash')" @update:model-value="togglePaymentMethod('cash', $event)" label="Tunai (Cash)" />
                    <UCheckbox :model-value="isMethodEnabled('bank_transfer')" @update:model-value="togglePaymentMethod('bank_transfer', $event)" label="Transfer Virtual Account (Otomatis)" />
                    <UCheckbox :model-value="isMethodEnabled('qris')" @update:model-value="togglePaymentMethod('qris', $event)" label="QRIS (Otomatis)" />
                    <UCheckbox :model-value="isMethodEnabled('manual_transfer')" @update:model-value="togglePaymentMethod('manual_transfer', $event)" label="Transfer Manual (Verifikasi Admin)" />
                </div>

                <div class="border-t border-gray-200 dark:border-gray-800 my-6"></div>

                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-xl font-bold flex items-center gap-2">
                            <UIcon name="i-heroicons-credit-card" class="text-primary" />
                            Metode Transfer Manual
                        </h2>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Tambahkan rekening Bank atau E-Wallet yang bisa digunakan peserta untuk mentransfer uang pendaftaran secara manual.</p>
                    </div>
                </div>

                <div class="space-y-6">
                    <div v-for="(payment, index) in configurationState.manualPayments" :key="index"
                        class="flex flex-col gap-4 bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 relative transition-all duration-300 hover:shadow-md">
                        <div class="flex flex-col sm:flex-row gap-4">
                            <div class="flex-1 space-y-2">
                                <UFormField label="Nama Bank / E-Wallet" required>
                                    <UInput v-model="payment.name" placeholder="Misal: BCA / DANA" />
                                </UFormField>
                            </div>
                            <div class="flex-1 space-y-2">
                                <UFormField label="Nomor Rekening / No HP" required>
                                    <UInput v-model="payment.account" placeholder="Misal: 1234567890" />
                                </UFormField>
                            </div>
                            <div class="flex-1 space-y-2">
                                <UFormField label="Atas Nama" required>
                                    <UInput v-model="payment.owner" placeholder="Misal: Himatika ITSNU" />
                                </UFormField>
                            </div>
                        </div>
                        <div class="flex flex-col sm:flex-row gap-4 items-end">
                            <div class="flex-1 space-y-2">
                                <UFormField label="Instruksi Tambahan (Opsional)">
                                    <UInput v-model="payment.instructions"
                                        placeholder="Misal: Sertakan 3 digit terakhir NIM pada nominal transfer" />
                                </UFormField>
                            </div>
                            <div class="pb-1">
                                <UButton color="error" icon="i-heroicons-trash" variant="soft"
                                    @click="removePayment(index)">Hapus
                                </UButton>
                            </div>
                        </div>
                    </div>

                    <UButton color="neutral" icon="i-heroicons-plus" variant="outline" block size="lg"
                        class="border-dashed" @click="addPayment">
                        Tambah Rekening Baru
                    </UButton>
                </div>

                <template #footer>
                    <div class="flex justify-end gap-3">
                        <UButton :to="`/administrator/agendas/${id}`" color="neutral" variant="ghost">
                            Kembali
                        </UButton>
                        <UButton color="primary" @click="onSubmit" :loading="loading" icon="i-heroicons-document-check">
                            Simpan Pengaturan
                        </UButton>
                    </div>
                </template>
            </UCard>
        </div>
    </div>
</template>
