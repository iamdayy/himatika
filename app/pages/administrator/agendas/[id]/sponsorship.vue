<script setup lang="ts">
import imageCompression from 'browser-image-compression';
import type { IAgendaConfiguration } from '~~/types';
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

const moveUp = (index: number) => {
    if (index > 0 && configurationState.sponsors) {
        const temp = configurationState.sponsors[index - 1];
        if (temp) {
            configurationState.sponsors[index - 1] = configurationState.sponsors[index] as any;
            configurationState.sponsors[index] = temp as any;
        }
    }
}

const moveDown = (index: number) => {
    if (configurationState.sponsors && index < configurationState.sponsors.length - 1) {
        const temp = configurationState.sponsors[index + 1];
        if (temp) {
            configurationState.sponsors[index + 1] = configurationState.sponsors[index] as any;
            configurationState.sponsors[index] = temp as any;
        }
    }
}

const removeSponsor = (index: number) => {
    if (configurationState.sponsors) {
        configurationState.sponsors.splice(index, 1);
    }
}

const addSponsor = () => {
    if (!configurationState.sponsors) configurationState.sponsors = [];
    configurationState.sponsors.push({ name: '', logo: '', showOnPdf: false, url: '', priority: 0 } as any);
}

const handleImageUpload = async (event: Event, index: number) => {
    const target = event.target as HTMLInputElement;
    if (target && target.files && target.files.length > 0) {
        const file = target.files[0];

        if (!file) return;

        if (file.size / 1024 / 1024 > 0.2) {
            toast.add({ title: $ts('error'), description: 'Gambar terlalu besar', color: 'error' });
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.add({ title: $ts('error'), description: 'File harus berupa gambar', color: 'error' });
            return;
        }

        const options = {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
        };

        try {
            const compressedFile = await imageCompression(file, options);
            const reader = new FileReader();
            reader.onloadend = () => {
                if (configurationState.sponsors && configurationState.sponsors[index]) {
                    configurationState.sponsors[index].logo = reader.result as string;
                }
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            toast.add({ title: 'Gagal memproses gambar', color: 'error' });
        }
    }
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
    { label: $ts('agenda'), to: '/administrator/agendas', icon: 'i-heroicons-clipboard-document-list' },
    { label: agenda.value?.title || '', to: `/administrator/agendas/${id}`, icon: 'i-heroicons-document' },
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
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Atur urutan dan visibilitas sponsor
                                di sini. Posisi paling atas akan mendapat prioritas terbesar.</p>
                        </div>
                        <UButton color="primary" variant="solid" icon="i-heroicons-device-arrow-mobile"
                            :to="`/agendas/${id}`" target="_blank">
                            Lihat Halaman
                        </UButton>
                    </div>
                </template>

                <div class="space-y-6">
                    <div v-for="(sponsor, index) in configurationState.sponsors" :key="index"
                        class="flex flex-col sm:flex-row gap-4 items-end bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 relative group transition-all duration-300 hover:shadow-md">
                        <!-- Up/Down arrows for implicit ordering -->
                        <div
                            class="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <UButton v-if="index > 0" icon="i-heroicons-chevron-up" size="xs" color="neutral"
                                variant="solid" class="rounded-full shadow-sm" @click="moveUp(index)" />
                            <UButton v-if="index < (configurationState.sponsors?.length || 0) - 1"
                                icon="i-heroicons-chevron-down" size="xs" color="neutral" variant="solid"
                                class="rounded-full shadow-sm" @click="moveDown(index)" />
                        </div>

                        <div class="flex-1 w-full space-y-2">
                            <UFormField label="Nama Sponsor" required>
                                <UInput v-model="sponsor.name" placeholder="Misal: PT Telkom" />
                            </UFormField>
                        </div>
                        <div class="flex-1 w-full space-y-2">
                            <UFormField label="Logo Sponsor" required>
                                <div class="flex flex-col gap-2 w-full">
                                    <div v-if="sponsor.logo"
                                        class="h-16 rounded border flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden relative group">
                                        <NuxtImg :src="(sponsor.logo as string)" class="h-full object-contain" />
                                        <div
                                            class="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
                                            <UButton size="xs" color="neutral" variant="ghost" icon="i-heroicons-trash"
                                                @click="sponsor.logo = ''" />
                                        </div>
                                    </div>
                                    <UInput type="file" accept="image/*" @change="handleImageUpload($event, index)"
                                        v-else />
                                </div>
                            </UFormField>
                        </div>
                        <div class="space-y-2 flex flex-col justify-end pb-2">
                            <UFormField label="Tampil di Tiket PDF?">
                                <USwitch v-model="sponsor.showOnPdf" />
                            </UFormField>
                        </div>
                        <div class="pb-1">
                            <UButton color="error" icon="i-heroicons-trash" variant="soft"
                                @click="removeSponsor(index)" />
                        </div>
                    </div>

                    <UButton color="neutral" icon="i-heroicons-plus" variant="outline" block size="lg"
                        class="border-dashed" @click="addSponsor">
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
