<script setup lang="ts">
import type { IAgendaResponse } from '~~/types/IResponse';



definePageMeta({
    layout: 'dashboard',
    middleware: ['sidebase-auth', 'organizer']
});

const route = useRoute();
const id = route.params.id as string;
const { $api, $ts } = useNuxtApp();
const toast = useToast();

const { data: agenda } = await useAsyncData('admin-agenda-detail',
    () => $api<IAgendaResponse>('/api/agenda', { query: { id } }), {
    transform: (data) => data.data?.agenda
});

// Navigation Links
const links = computed(() => [{
    label: $ts('dashboard'),
    icon: 'i-heroicons-home',
    to: '/dashboard'
}, {
    label: $ts('agenda'),
    icon: 'i-heroicons-calendar',
    to: '/administrator/agendas'
},
{
    label: agenda?.value?.title || 'Agenda',
    icon: 'i-heroicons-calendar',
    to: `/administrator/agendas/${id}`
},
{
    label: $ts('committee'),
    to: `/administrator/agendas/${id}/committee`,
    icon: 'i-heroicons-link'
},
{
    label: $ts('add-committee'),
    icon: 'i-heroicons-user-plus',
}
]);

const loading = ref(false);
const jobTitle = ref('Anggota'); // Default jabatan

// List Jabatan Umum (Bisa disesuaikan atau diambil dari config)
const jobOptions = ['Ketua Pelaksana', 'Sekretaris', 'Bendahara', 'Koordinator Acara', 'Divisi Acara', 'Koordinator Humas', 'Divisi Humas', 'Koordinator Perkap', 'Divisi Perkap', 'Dokumentasi', 'Konsumsi', 'Keamanan', 'Anggota'];
const createJob = (val: string) => {
    jobOptions.push(val);
    jobTitle.value = val;
};
// --- MODE MEMBER (SEARCH) ---
const selectedMember = ref<string | undefined>(undefined);
const memberSearchTerm = ref('');
const { data: members, pending } = useAsyncData('members-list', () => $api('/api/member/public', {
    query: {
        search: memberSearchTerm.value,
    }
}), {
    lazy: true,
    default: () => [],
    transform: (data) => {
        const obj = data.data?.members?.map((member) => ({
            ...member,
            avatar: { src: member.avatar || '/img/profile-blank.png' },
            label: member.fullName,
            value: member.id
        })) || [];
        return obj || [];
    },
    watch: [memberSearchTerm]
});

const submit = async () => {
    if (!selectedMember.value) {
        toast.add({ title: 'Pilih member terlebih dahulu', color: 'warning' });
        return;
    };

    loading.value = true;
    try {
        await $api(`/api/agenda/${id}/committee`, {
            method: 'POST',
            body: {
                member: selectedMember.value,
                job: jobTitle.value,
                approved: true // Karena admin yang add, auto-approve
            }
        });

        toast.add({ title: 'Panitia berhasil ditambahkan', color: 'success' });

        // Reset form
        selectedMember.value = undefined;
        jobTitle.value = 'Anggota';

    } catch (error: any) {
        toast.add({ title: 'Gagal menambahkan', description: error.message, color: 'error' });
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="space-y-6 mb-24">
        <UBreadcrumb :items="links" />


        <UCard>
            <template #header>
                <div class="flex items-center justify-between">
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Tambah Panitia</h1>
                    <UButton variant="subtle" icon="i-heroicons-document-arrow-up"
                        :to="`/administrator/agendas/${id}/committee/import`">Import Excel</UButton>
                </div>
            </template>
            <div class="space-y-6">
                <UFormField label="Cari Mahasiswa" help="Ketik Nama atau NIM (min. 3 karakter)" class="w-full">
                    <USelectMenu v-model="selectedMember" v-model:search-term="memberSearchTerm"
                        placeholder="Ketik untuk mencari..." :items="members" value-key="value" label-key="label"
                        class="w-full">
                        <template #item="{ item }">
                            <div class="flex items-center gap-2 w-full">
                                <div class="flex-col flex">
                                    <span class="truncate font-medium">{{ item.fullName }}</span>
                                    <span class="text-xs text-gray-500">{{ item.NIM }} • {{ item.class ||
                                        'Unknown'
                                    }}</span>
                                </div>
                            </div>
                        </template>
                        <template #empty>
                            <div v-if="pending">
                                <div class="flex items-center gap-2">
                                    <USkeleton class="h-4 w-4 rounded-full" />

                                    <div class="grid gap-2">
                                        <USkeleton class="h-2 w-[120px]" />
                                        <USkeleton class="h-2 w-[100px]" />
                                    </div>
                                </div>
                                <div class="mt-4 text-center text-gray-500">
                                    Mencari member...
                                </div>
                            </div>
                            <div v-else class="text-center text-gray-500">
                                Tidak ada member ditemukan.
                            </div>
                        </template>
                    </USelectMenu>
                </UFormField>

                <!-- <div v-if="selectedMember" class="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 transition-all">
                    <UAvatar :src="selectedMember.avatar || '/img/profile-blank.png'" size="md" />
                    <div>
                        <p class="font-semibold text-sm">{{ selectedMember.fullName }}</p>
                        <p class="text-xs text-gray-500">{{ selectedMember.email }}</p>
                    </div>
                    <div class="ml-auto">
                        <UIcon name="i-heroicons-check-circle" class="text-green-500 w-6 h-6" />
                    </div>
                </div> -->

                <UFormField label="Posisi / Jabatan">
                    <USelectMenu v-model="jobTitle" :items="jobOptions" searchable creatable
                        placeholder="Pilih atau ketik jabatan baru..." @create="createJob" class="w-full" />
                </UFormField>

                <UButton block :loading="loading" @click="submit" color="primary" size="lg">
                    Tambahkan ke Tim Panitia
                </UButton>
            </div>
        </UCard>
    </div>
</template>