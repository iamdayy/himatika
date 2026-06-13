<script setup lang="ts">
import type { IAgenda, IAgendaConfiguration, ICategory } from '~~/types';
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
    sponsors: [],
});

watch(agenda, (newAgenda) => {
    if (newAgenda?.configuration) {
        Object.assign(configurationState, newAgenda.configuration);
        if (!configurationState.sponsors) {
            configurationState.sponsors = [];
        }
    }
}, { immediate: true });

const loading = ref(false);

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
                title: $ts('success'), description: 'Sponsorship berhasil diperbarui', color: 'success'
            });
            refresh();
        } else {
            toast.add({
                title: $ts('failed'), description: 'Gagal memperbarui sponsorship', color: 'error'
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
    { label: $ts('agenda'), to: '/dashboard/agendas', icon: 'i-heroicons-clipboard-document-list' },
    { label: agenda.value?.title || '', to: `/agendas/${id}`, icon: 'i-heroicons-document' },
    { label: 'Sponsorship', icon: 'i-heroicons-star' },
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
                                <UIcon name="i-heroicons-star" class="text-yellow-500" />
                                Kelola Sponsorship
                            </h2>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Atur urutan dan visibilitas sponsor di sini. Posisi paling atas akan mendapat prioritas terbesar.</p>
                        </div>
                        <UButton color="primary" variant="solid" icon="i-heroicons-device-arrow-mobile" :to="`/agendas/${id}`" target="_blank">
                            Lihat Halaman
                        </UButton>
                    </div>
                </template>

                <div class="space-y-6">
                    <div v-for="(sponsor, index) in configurationState.sponsors" :key="index" class="flex flex-col sm:flex-row gap-4 items-end bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 relative group transition-all duration-300 hover:shadow-md">
                        <!-- Up/Down arrows for implicit ordering -->
                        <div class="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <UButton v-if="index > 0" icon="i-heroicons-chevron-up" size="xs" color="gray" variant="solid" class="rounded-full shadow-sm" @click="() => { const temp = configurationState.sponsors![index-1]; configurationState.sponsors![index-1] = sponsor; configurationState.sponsors![index] = temp; }" />
                            <UButton v-if="index < (configurationState.sponsors?.length || 0) - 1" icon="i-heroicons-chevron-down" size="xs" color="gray" variant="solid" class="rounded-full shadow-sm" @click="() => { const temp = configurationState.sponsors![index+1]; configurationState.sponsors![index+1] = sponsor; configurationState.sponsors![index] = temp; }" />
                        </div>

                        <div class="flex-1 w-full space-y-2">
                            <UFormField label="Nama Sponsor" required>
                                <UInput v-model="sponsor.name" placeholder="Misal: PT Telkom" />
                            </UFormField>
                        </div>
                        <div class="flex-1 w-full space-y-2">
                            <UFormField label="URL Logo (Link gambar)" required>
                                <UInput v-model="(sponsor.logo as string)" placeholder="https://..." />
                            </UFormField>
                        </div>
                        <div class="space-y-2 flex flex-col justify-end pb-2">
                            <UFormField label="Tampil di Tiket PDF?">
                                <USwitch v-model="sponsor.showOnPdf" />
                            </UFormField>
                        </div>
                        <div class="pb-1">
                            <UButton color="error" icon="i-heroicons-trash" variant="soft" @click="configurationState.sponsors!.splice(index, 1)" />
                        </div>
                    </div>

                    <UButton color="neutral" icon="i-heroicons-plus" variant="outline" block size="lg" class="border-dashed" @click="configurationState.sponsors!.push({ name: '', logo: '', showOnPdf: false })">
                        Tambah Sponsor Baru
                    </UButton>
                </div>

                <template #footer>
                    <div class="flex justify-end gap-3">
                        <UButton :to="`/administrator/agendas/${id}`" color="neutral" variant="ghost">
                            Batal
                        </UButton>
                        <UButton color="primary" @click="onSubmit" :loading="loading" icon="i-heroicons-document-check">
                            Simpan Perubahan
                        </UButton>
                    </div>
                </template>
            </UCard>
        </div>
    </div>
</template>
