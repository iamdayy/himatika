<script setup lang="ts">
import type { IGuest, IMember, IParticipant, IQuestion } from '~~/types';

// Props
const props = defineProps<{
    participant?: IParticipant | null;
}>();



// Helper: Format Tanggal
const formatDate = (date?: string | Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Helper: Warna Badge Pembayaran
const getPaymentColor = (status?: string) => {
    switch (status) {
        case 'success': return 'success';
        case 'pending': return 'warning';
        case 'failed': return 'error';
        case 'expired': return 'neutral';
        default: return 'neutral';
    }
};

// Computed: Normalisasi Data Profil (Member vs Guest)
const profile = computed(() => {
    if (!props.participant) return null;

    // Jika Member
    if (props.participant.member && typeof props.participant.member === 'object') {
        const m = props.participant.member as IMember;
        return {
            type: 'Member',
            fullName: m.fullName,
            email: m.email,
            phone: m.phone,
            avatar: m.avatar,
            identifierLabel: 'NIM',
            identifier: m.NIM,
            institution: `Class ${m.class} - Sem ${m.semester}`,
            isGuest: false
        };
    }

    // Jika Guest
    if (props.participant.guest) {
        const g = props.participant.guest as IGuest;
        return {
            type: 'Guest',
            fullName: g.fullName,
            email: g.email,
            phone: g.phone,
            avatar: null, // Guest biasanya tidak punya avatar
            identifierLabel: 'Instance/NIM',
            identifier: g.instance || g.NIM || '-',
            institution: g.instance || (g.prodi ? `${g.prodi} - ${g.class || ''}` : 'Public'),
            isGuest: true
        };
    }

    return null;
});

// Tabs Items
const items = [{
    slot: 'general',
    label: 'General',
    icon: 'i-heroicons-information-circle'
}, {
    slot: 'answers',
    label: 'Answers',
    icon: 'i-heroicons-chat-bubble-bottom-center-text'
}, {
    slot: 'payment',
    label: 'Payment',
    icon: 'i-heroicons-banknotes'
}];
</script>

<template>
    <UModal>

        <template #header="{ close }">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <UAvatar :src="profile?.avatar || '/img/profile-blank.png'" :alt="profile?.fullName" size="xl"
                        class="ring-2 ring-primary-500/20" :ui="{ fallback: 'text-xs' }" />
                    <div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                            {{ profile?.fullName || 'Unknown' }}
                        </h3>
                        <div class="flex flex-wrap items-center gap-2 mt-1">
                            <UBadge :color="profile?.isGuest ? 'primary' : 'secondary'" variant="subtle" size="xs">
                                {{ profile?.type }}
                            </UBadge>
                            <UBadge color="neutral" variant="solid" size="xs">
                                {{ profile?.identifierLabel }}: {{ profile?.identifier }}
                            </UBadge>
                        </div>
                    </div>
                </div>
                <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark-20-solid" @click="close()" />
            </div>
        </template>
        <template #body>
            <div v-if="participant && profile" class="min-h-[300px]">
                <UTabs :items="items" class="w-full">

                    <template #general>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">

                            <UCard class="col-span-1 md:col-span-2 bg-gray-50 dark:bg-gray-800/50">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-gray-500 font-medium">Presence Status</span>
                                    <UBadge :color="participant.visiting ? 'success' : 'neutral'" variant="subtle"
                                        size="md">
                                        {{ participant.visiting ? 'Present' : 'Absent' }}
                                    </UBadge>
                                </div>
                                <div class="flex items-center gap-2 text-xs text-gray-500">
                                    <UIcon name="i-heroicons-clock" />
                                    <span>Check-in: {{
                                        participant.visiting
                                            ? formatDate(participant.visitTime)
                                            : 'Not yet' }}</span>
                                </div>
                            </UCard>

                            <div class="col-span-1 md:col-span-2 space-y-3 mt-2">
                                <div
                                    class="flex flex-col md:flex-row justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                                    <span class="text-gray-500 text-xs uppercase tracking-wide">Email</span>
                                    <span class="font-medium truncate max-w-[250px]">{{ profile.email }}</span>
                                </div>
                                <div
                                    class="flex flex-col md:flex-row justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                                    <span class="text-gray-500 text-xs uppercase tracking-wide">Phone</span>
                                    <span class="font-medium">{{ profile.phone || '-' }}</span>
                                </div>
                                <div
                                    class="flex flex-col md:flex-row justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                                    <span class="text-gray-500 text-xs uppercase tracking-wide">Institution /
                                        Class</span>
                                    <span class="font-medium text-right">{{ profile.institution }}</span>
                                </div>
                            </div>
                        </div>
                    </template>

                    <template #answers>
                        <div class="space-y-4 mt-4">
                            <div v-if="(!participant.answers || participant.answers.length === 0)"
                                class="text-center text-gray-400 py-8 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                                <UIcon name="i-heroicons-chat-bubble-left" class="text-3xl mb-2" />
                                <p>No registration questions answered.</p>
                            </div>

                            <div v-else v-for="(ans, index) in participant.answers" :key="index"
                                class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <p class="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2">
                                    <span class="mr-2 text-gray-400">Q{{ index + 1 }}.</span>
                                    {{ (ans.question as IQuestion)?.question || 'Question' }}
                                </p>

                                <div class="text-gray-700 dark:text-gray-200 text-sm pl-6">
                                    <div
                                        v-if="typeof ans.value === 'string' && (ans.value.startsWith('http') || ans.value.startsWith('/'))">
                                        <UButton :to="ans.value" target="_blank" variant="soft" color="neutral"
                                            icon="i-heroicons-paper-clip" size="xs">
                                            Open Attachment
                                        </UButton>
                                    </div>
                                    <div v-else-if="Array.isArray(ans.value)">
                                        <div class="flex flex-wrap gap-2">
                                            <UBadge v-for="val in ans.value" :key="val" color="neutral" variant="solid"
                                                size="xs">{{ val }}</UBadge>
                                        </div>
                                    </div>
                                    <div v-else>
                                        {{ ans.value }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>

                    <template #payment>
                        <div class="mt-4">
                            <div v-if="!participant.payment" class="text-center py-8">
                                <UIcon name="i-heroicons-banknotes" class="text-4xl text-gray-300 mb-2" />
                                <p class="text-gray-500">Free event or no payment recorded.</p>
                            </div>

                            <div v-else class="space-y-4">
                                <div
                                    class="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <span
                                        class="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wider">Payment
                                        Status</span>
                                    <UBadge :color="getPaymentColor(participant.payment.status)" size="lg"
                                        variant="solid" class="px-4 py-1 text-base">
                                        {{ participant.payment.status?.toUpperCase() || 'UNKNOWN' }}
                                    </UBadge>
                                    <div
                                        class="flex items-center gap-2 mt-4 text-xs text-gray-400 font-mono bg-white dark:bg-gray-900 px-3 py-1 rounded">
                                        <span>ID:</span>
                                        <span>{{ participant.payment.transaction_id || participant.payment.order_id ||
                                            '-' }}</span>
                                        <UButton icon="i-heroicons-clipboard" variant="link" color="neutral" size="xs"
                                            :padded="false" />
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div class="p-3 border rounded-lg dark:border-gray-700">
                                        <p class="text-[10px] text-gray-500 uppercase tracking-wide">Method</p>
                                        <p class="font-semibold capitalize">{{ participant.payment.method }}</p>
                                    </div>
                                    <div class="p-3 border rounded-lg dark:border-gray-700">
                                        <p class="text-[10px] text-gray-500 uppercase tracking-wide">Type</p>
                                        <p class="font-semibold capitalize">{{
                                            participant.payment.type.replace('_', '') }}</p>
                                    </div>
                                    <div class="p-3 border rounded-lg dark:border-gray-700">
                                        <p class="text-[10px] text-gray-500 uppercase tracking-wide">Bank/Provider</p>
                                        <p class="font-semibold uppercase">{{ participant.payment.bank || '-' }}</p>
                                    </div>
                                    <div class="p-3 border rounded-lg dark:border-gray-700">
                                        <p class="text-[10px] text-gray-500 uppercase tracking-wide">Timestamp</p>
                                        <p class="font-semibold">{{ formatDate(participant.payment.time) }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>

                </UTabs>
            </div>
        </template>

        <template #footer="{ close }">
            <div class="flex justify-end gap-2">
                <UButton color="neutral" @click="close()">Close</UButton>
                <UButton v-if="profile?.phone"
                    :to="`https://wa.me/${profile.phone.replace(/^0/, '62').replace(/\D/g, '')}`" target="_blank"
                    icon="i-heroicons-chat-bubble-left-right" color="success" variant="soft">
                    Chat WhatsApp
                </UButton>
            </div>
        </template>
    </UModal>
</template>