<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui';
import type { IAgendaResponse, IMemberResponse } from '~~/types/IResponse';

definePageMeta({
    layout: 'dashboard',
    middleware: ['sidebase-auth', 'organizer']
});

const route = useRoute();
const id = route.params.id as string;
const { $api } = useNuxtApp();
const toast = useToast();

const { data: agenda } = await useAsyncData('admin-agenda-detail',
    () => $api<IAgendaResponse>('/api/agenda', { query: { id } }), {
    transform: (data) => data.data?.agenda
});

// Navigation Links
const links = computed(() => [{
    label: 'Dasbor',
    icon: 'i-heroicons-home',
    to: '/dashboard'
}, {
    label: 'Agenda',
    icon: 'i-heroicons-calendar',
    to: '/administrator/agendas'
},
{
    label: agenda?.value?.title || 'Agenda',
    icon: 'i-heroicons-calendar',
    to: `/administrator/agendas/${id}`
},
{
    label: 'Peserta',
    to: `/administrator/agendas/${id}/participant`,
    icon: 'i-heroicons-link'
},
{
    label: 'Add-Participant',
    icon: 'i-heroicons-user-plus',
}
]);

// Tabs
const tabs = computed<TabsItem[]>(() => [
    { label: 'Add-Member-Participant', icon: 'i-heroicons-user-group', slot: 'member', value: 'member' },
    { label: 'Add-Guest-Participant', icon: 'i-heroicons-user-group', slot: 'guest', value: 'guest' }
]);

// State
const loading = ref(false);
const mode = ref<'member' | 'guest'>('member'); // Toggle Member vs Guest

// --- MODE MEMBER (SEARCH) ---
const selectedMember = ref<string | undefined>(undefined);
const memberSearchTerm = ref('');
const { data: members, pending } = useAsyncData('members-list', () => $api<IMemberResponse>('/api/member/public', {
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

// --- MODE GUEST (MANUAL) ---
const guestForm = reactive({
    fullName: '',
    email: '',
    instance: '', // Instansi / Asal Sekolah
    phone: ''
});

// --- SUBMIT ---
const submit = async () => {
    loading.value = true;
    try {
        let payload = {};

        if (mode.value === 'member') {
            if (!selectedMember.value) throw new Error('Pilih member terlebih dahulu');
            // Payload untuk member existing
            payload = {
                member: selectedMember.value, // Mengirim ID member
                // type: 'member' // Opsional, tergantung backend
            };
        } else {
            // Payload untuk guest
            if (!guestForm.fullName) throw new Error('Nama lengkap wajib diisi');
            payload = {
                guest: { ...guestForm },
                // type: 'guest'
            };
        }

        // Kirim ke API Add Participant
        await $api(`/api/agenda/${id}/participant`, {
            method: 'POST',
            body: payload
        });

        toast.add({ title: 'Berhasil menambahkan peserta', color: 'success' });

        // Reset form agar bisa input lagi dengan cepat
        selectedMember.value = undefined;
        guestForm.fullName = '';
        guestForm.email = '';

        // Opsional: Kembali ke list atau tetap disini
        // navigateTo(`/administrator/agendas/${id}/participant`);

    } catch (error: any) {
        toast.add({
            title: 'Gagal menambahkan',
            description: error.data?.message || error.message,
            color: 'error'
        });
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
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Tambah Peserta Manual</h1>
                    <UButton variant="subtle" icon="i-heroicons-document-arrow-up"
                        :to="`/administrator/agendas/${id}/participant/import`">Import</UButton>
                </div>
            </template>
            <UTabs :items="tabs" v-model="mode" class="mb-6">
                <template #member>
                    <div class="space-y-6">
                        <UFormField label="Cari Mahasiswa" help="Ketik Nama atau NIM (min. 3 karakter)" class="w-full">
                            <USelectMenu v-model="selectedMember" v-model:search-term="memberSearchTerm"
                                placeholder="Ketik untuk mencari..." :items="members" value-key="value"
                                label-key="label">
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
                    </div>
                </template>
                <template #guest>
                    <div class="space-y-4">
                        <UFormField label="Nama Lengkap" required>
                            <UInput v-model="guestForm.fullName" icon="i-heroicons-user"
                                placeholder="Nama peserta..." />
                        </UFormField>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <UFormField label="Email">
                                <UInput v-model="guestForm.email" icon="i-heroicons-envelope"
                                    placeholder="email@contoh.com" />
                            </UFormField>
                            <UFormField label="No. WhatsApp">
                                <UInput v-model="guestForm.phone" icon="i-heroicons-phone" placeholder="08..." />
                            </UFormField>
                        </div>
                        <UFormField label="Instansi / Asal">
                            <UInput v-model="guestForm.instance" icon="i-heroicons-building-office"
                                placeholder="Umum / Nama Kampus..." />
                        </UFormField>
                    </div>
                </template>
            </UTabs>

            <template #footer>
                <div class="flex justify-between items-center gap-3">
                    <UButton variant="ghost" to="../participant">Batal</UButton>
                    <UButton :loading="loading" @click="submit" color="primary">
                        {{ mode === 'member' ? 'Tambahkan Member' : 'Simpan Data Tamu' }}
                    </UButton>
                </div>
            </template>
        </UCard>
    </div>
</template>