<script setup lang="ts">
import type { IMember } from '~~/types';

// Props: Menerima data member dan status modal
const props = defineProps<{
    modelValue: boolean; // Untuk v-model (buka/tutup modal)
    member?: IMember | null; // Data member yang akan ditampilkan
}>();

// Emits: Untuk update v-model
const emit = defineEmits(['update:modelValue']);

// Computed untuk v-model
const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value),
});

// Helper untuk format tanggal
const formatDate = (date?: string | Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

// Item untuk Tabs
const items = [{
    slot: 'personal',
    label: 'Personal Info',
    icon: 'i-heroicons-user'
}, {
    slot: 'academic',
    label: 'Academic',
    icon: 'i-heroicons-academic-cap'
}, {
    slot: 'activity',
    label: 'Activity',
    icon: 'i-heroicons-chart-bar'
}];
</script>

<template>
    <UModal v-model="isOpen">
        <template #body>

            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <UAvatar :src="member?.avatar || '/img/profile-blank.png'" :alt="member?.fullName" size="xl"
                        class="ring-2 ring-primary-500/20" />
                    <div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                            {{ member?.fullName }}
                        </h3>
                        <div class="flex items-center gap-2 mt-1">
                            <UBadge color="primary" variant="subtle" size="xs">{{ member?.NIM }}</UBadge>
                            <UBadge :color="member?.status === 'active' ? 'success' : 'neutral'" variant="soft"
                                size="xs">
                                {{ member?.status || 'Unknown' }}
                            </UBadge>
                        </div>
                    </div>
                </div>

                <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark-20-solid" @click="isOpen = false" />
            </div>

            <div v-if="member">
                <UTabs :items="items" class="w-full">

                    <template #personal="{ item }">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                            <div class="space-y-1">
                                <p class="text-gray-500 dark:text-gray-400 font-medium">Email</p>
                                <p class="text-gray-900 dark:text-white">{{ member.email || '-' }}</p>
                            </div>
                            <div class="space-y-1">
                                <p class="text-gray-500 dark:text-gray-400 font-medium">Phone</p>
                                <p class="text-gray-900 dark:text-white">{{ member.phone || '-' }}</p>
                            </div>
                            <div class="space-y-1">
                                <p class="text-gray-500 dark:text-gray-400 font-medium">Gender</p>
                                <p class="text-gray-900 dark:text-white">{{ member.sex === 'male' ? 'Male' : 'Female' }}
                                </p>
                            </div>
                            <div class="space-y-1">
                                <p class="text-gray-500 dark:text-gray-400 font-medium">Religion</p>
                                <p class="text-gray-900 dark:text-white">{{ member.religion || '-' }}</p>
                            </div>
                            <div class="space-y-1">
                                <p class="text-gray-500 dark:text-gray-400 font-medium">Birth</p>
                                <p class="text-gray-900 dark:text-white">{{ member.birth && `${member.birth.place},
                                    ${formatDate(member.birth.date)}` }}</p>
                            </div>
                            <div class="space-y-1">
                                <p class="text-gray-500 dark:text-gray-400 font-medium">Citizen</p>
                                <p class="text-gray-900 dark:text-white">{{ member.citizen || '-' }}</p>
                            </div>
                            <div class="col-span-1 md:col-span-2 space-y-1">
                                <p class="text-gray-500 dark:text-gray-400 font-medium">Address</p>
                                <p class="text-gray-900 dark:text-white">{{ member.address || '-' }}</p>
                            </div>
                        </div>
                    </template>

                    <template #academic="{ item }">
                        <div class="grid grid-cols-2 gap-4 mt-4 text-sm">
                            <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                                <p class="text-gray-500 dark:text-gray-400 text-xs uppercase">Class</p>
                                <p class="text-lg font-bold text-primary-600">{{ member.class || '-' }}</p>
                            </div>
                            <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                                <p class="text-gray-500 dark:text-gray-400 text-xs uppercase">Semester</p>
                                <p class="text-lg font-bold text-primary-600">{{ member.semester || '-' }}</p>
                            </div>
                            <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                                <p class="text-gray-500 dark:text-gray-400 text-xs uppercase">Entry Year</p>
                                <p class="text-lg font-bold text-primary-600">{{ member.enteredYear || '-' }}</p>
                            </div>
                            <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                                <p class="text-gray-500 dark:text-gray-400 text-xs uppercase">Total Points</p>
                                <p class="text-lg font-bold text-green-600">{{ member.point && member.point.length ?
                                    member.point[0]!.point : 0 }}</p>
                            </div>
                        </div>
                    </template>

                    <template #activity="{ item }">
                        <div class="space-y-4 mt-4">
                            <div
                                class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div class="flex items-center gap-3">
                                    <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                                        <UIcon name="i-heroicons-calendar"
                                            class="w-5 h-5 text-blue-600 dark:text-blue-300" />
                                    </div>
                                    <span class="font-medium">Agendas Participated</span>
                                </div>
                                <span class="text-xl font-bold">{{ member.agendas?.members ?
                                    member.agendas.members?.length : 0 }}</span>
                            </div>

                            <div
                                class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div class="flex items-center gap-3">
                                    <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                                        <UIcon name="i-heroicons-code-bracket"
                                            class="w-5 h-5 text-purple-600 dark:text-purple-300" />
                                    </div>
                                    <span class="font-medium">Projects Created</span>
                                </div>
                                <span class="text-xl font-bold">{{ member.projects ? member.projects.length : 0
                                }}</span>
                            </div>
                        </div>
                    </template>

                </UTabs>
            </div>

        </template>
    </UModal>
</template>