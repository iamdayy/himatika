<script setup lang="ts">

const emit = defineEmits(['close', 'success']);
const { $api } = useNuxtApp();
const toast = useToast();

const loading = ref(false);

const form = reactive({
    amount: 10,
    reason: '',
    type: 'achievement',
    date: new Date().toISOString().split('T')[0] // Default hari ini
});

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
        toast.add({ title: 'Pilih member dulu', color: 'warning' });
        return;
    }
    if (!form.reason) {
        toast.add({ title: 'Isi keterangan / alasan', color: 'warning' });
        return;
    }

    loading.value = true;
    try {
        await $api('/api/point/add', {
            method: 'POST',
            body: {
                memberId: selectedMember.value,
                amount: form.amount,
                reason: form.reason,
                type: form.type,
                date: form.date
            }
        });

        toast.add({ title: 'Reward berhasil disimpan', color: 'success' });
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
            <div class="flex justify-between items-center">
                <h3 class="font-semibold text-lg">Input Reward / Poin Manual</h3>
                <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" @click="$emit('close')" />
            </div>
        </template>
        <template #body>
            <div class="space-y-4">
                <UFormField label="Cari Mahasiswa" required>
                    <USelectMenu v-model="selectedMember" v-model:search-term="memberSearchTerm"
                        placeholder="Ketik untuk mencari..." :items="members" value-key="value" label-key="label">
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

                <!-- <div v-if="selectedMember" class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center gap-3">
                <UAvatar :src="selectedMember.avatar || '/img/profile-blank.png'" size="sm" />
                <div>
                    <p class="font-bold text-sm">{{ selectedMember.fullName }}</p>
                    <p class="text-xs text-gray-500">Poin akan dihitung pada semester sesuai tanggal input.</p>
                </div>
            </div> -->

                <div class="grid grid-cols-2 gap-4">
                    <UFormField label="Tipe">
                        <USelectMenu v-model="form.type"
                            :items="[{ label: 'Reward (+)', value: 'achievement' }, { label: 'Hukuman (-)', value: 'punishment' }]"
                            value-key="value" label-key="label" class="w-full" />
                    </UFormField>
                    <UFormField label="Jumlah Poin">
                        <UInput type="number" v-model="form.amount" :min="1" />
                    </UFormField>
                </div>

                <UFormField label="Tanggal Input" help="Poin akan masuk ke semester pada tanggal ini">
                    <UInput type="date" v-model="form.date" />
                </UFormField>

                <UFormField label="Keterangan / Alasan" required>
                    <UTextarea v-model="form.reason" placeholder="Contoh: Juara 1 Lomba Web Design..." />
                </UFormField>
            </div>
        </template>
        <template #footer>
            <div class="flex justify-between items-center gap-2 w-full">
                <UButton variant="ghost" @click="$emit('close')">Batal</UButton>
                <UButton :loading="loading" @click="submit" color="primary">
                    Simpan
                </UButton>
            </div>
        </template>
    </UModal>
</template>