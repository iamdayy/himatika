<script setup lang="ts">
import type { ICommittee, IMember, IQuestion } from '~~/types';

const { $ts } = useI18n();
// Props
const props = defineProps<{
    committee?: ICommittee | null;
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

// Helper: Warna Badge Approval
const getApprovalColor = (approved?: boolean) => {
    return approved ? 'success' : 'warning';
};

// Casting member agar aman diakses di template
const memberData = computed(() => props.committee?.member as IMember | undefined);

// Tabs Items
const items = [{
    slot: 'general',
    label: $ts('general'),
    icon: 'i-heroicons-information-circle'
}, {
    slot: 'answers',
    label: $ts('answers_recruitment'),
    icon: 'i-heroicons-chat-bubble-bottom-center-text'
}, {
    slot: 'payment',
    label: $ts('payment'),
    icon: 'i-heroicons-banknotes'
}];
</script>

<template>
    <UModal :title="$ts('committee_details')">
        <template #header="{ close }">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <UAvatar :src="memberData?.avatar || '/img/profile-blank.png'" :alt="memberData?.fullName" size="xl"
                        class="ring-2 ring-primary-500/20" />
                    <div>
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
                            {{ memberData?.fullName || $ts('unknown_member') }}
                        </h3>
                        <div class="flex flex-wrap items-center gap-2 mt-1">
                            <UBadge color="primary" variant="subtle" size="lg">{{ memberData?.NIM }}</UBadge>
                            <UBadge color="neutral" variant="solid" size="lg">{{ committee?.job }}</UBadge>
                        </div>
                    </div>
                </div>
                <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark-20-solid" @click="close()" />
            </div>
        </template>
        <template #body>
            <div v-if="committee" class="min-h-[300px]">
                <UTabs :items="items" class="w-full">

                    <template #general>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                            <UCard class="bg-gray-50 dark:bg-gray-800/50">
                                <div class="flex justify-between items-start mb-2">
                                    <span class="text-gray-500 font-medium">Status</span>
                                    <UBadge :color="getApprovalColor(committee.approved)" variant="subtle">
                                        {{ committee.approved ? $ts('approved') : $ts('pending_review') }}
                                    </UBadge>
                                </div>
                                <div class="text-xs text-gray-500">
                                    Updated at: {{ formatDate(committee.approvedAt) }}
                                </div>
                            </UCard>

                            <UCard class="bg-gray-50 dark:bg-gray-800/50">
                                <div class="flex justify-between items-start mb-2">
                                    <span class="text-gray-500 font-medium">Presence</span>
                                    <UBadge :color="committee.visiting ? 'success' : 'neutral'" variant="subtle">
                                        {{ committee.visiting ? $ts('visited') : $ts('absent') }}
                                    </UBadge>
                                </div>
                                <div v-if="committee.visiting" class="text-xs text-gray-500">
                                    Time: {{ formatDate(committee.visitTime) }}
                                </div>
                            </UCard>

                            <div class="col-span-1 md:col-span-2 space-y-2 mt-2">
                                <div class="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                                    <span class="text-gray-500">Email</span>
                                    <span class="font-medium">{{ memberData?.email }}</span>
                                </div>
                                <div class="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                                    <span class="text-gray-500">Phone</span>
                                    <span class="font-medium">{{ memberData?.phone || '-' }}</span>
                                </div>
                                <div class="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                                    <span class="text-gray-500">Class</span>
                                    <span class="font-medium">{{ memberData?.class }} - Sem {{ memberData?.semester
                                    }}</span>
                                </div>
                            </div>
                        </div>
                    </template>

                    <template #answers>
                        <div class="space-y-4 mt-4">
                            <div v-if="(!committee.answers || committee.answers.length === 0)"
                                class="text-center text-gray-400 py-4">
                                {{ $ts('no_answers_provided') }}
                            </div>

                            <div v-for="(ans, index) in committee.answers" :key="index"
                                class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <p class="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-1">
                                    {{ (ans.question as IQuestion)?.question || $ts('question') }}
                                </p>

                                <div class="text-gray-700 dark:text-gray-200 text-sm">
                                    <div
                                        v-if="typeof ans.value === 'string' && (ans.value.startsWith('http') || ans.value.startsWith('/'))">
                                        <UButton :to="ans.value" target="_blank" variant="link"
                                            icon="i-heroicons-paper-clip" :padded="false">
                                            {{ $ts('view_attachment_link') }}
                                        </UButton>
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
                            <div v-if="!committee.payment" class="text-center py-8">
                                <UIcon name="i-heroicons-banknotes" class="text-4xl text-gray-300 mb-2" />
                                <p class="text-gray-500">{{ $ts('no_payment_data') }}</p>
                            </div>

                            <div v-else class="space-y-4">
                                <div
                                    class="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                    <span class="text-sm text-gray-500 mb-1">Payment Status</span>
                                    <UBadge :color="getPaymentColor(committee.payment.status)" size="lg"
                                        variant="solid">
                                        {{ committee.payment.status?.toUpperCase() || 'UNKNOWN' }}
                                    </UBadge>
                                    <span class="text-xs text-gray-400 mt-2">
                                        Transaction ID: {{ committee.payment.transaction_id || '-' }}
                                    </span>
                                </div>

                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div class="p-3 border rounded-lg dark:border-gray-700">
                                        <p class="text-xs text-gray-500 uppercase">Method</p>
                                        <p class="font-semibold">{{ committee.payment.method }}</p>
                                    </div>
                                    <div class="p-3 border rounded-lg dark:border-gray-700">
                                        <p class="text-xs text-gray-500 uppercase">Type</p>
                                        <p class="font-semibold">{{ committee.payment.type }}</p>
                                    </div>
                                    <div class="p-3 border rounded-lg dark:border-gray-700">
                                        <p class="text-xs text-gray-500 uppercase">Bank/Provider</p>
                                        <p class="font-semibold">{{ committee.payment.bank || '-' }}</p>
                                    </div>
                                    <div class="p-3 border rounded-lg dark:border-gray-700">
                                        <p class="text-xs text-gray-500 uppercase">Date</p>
                                        <p class="font-semibold">{{ formatDate(committee.payment.time) }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>

                </UTabs>
            </div>
        </template>
    </UModal>
</template>