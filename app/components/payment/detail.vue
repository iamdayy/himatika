<template>
    <UCard v-if="payment.status === 'pending'">
        <template #header>
            <div class="p-4 text-white bg-opacity-75 bg-primary">
                <h1 class="text-xl font-semibold">Payment Details</h1>
                <p class="text-sm opacity-80">
                    Complete your payment before the time expires
                </p>
            </div>

            <div class="p-4 border-b bg-amber-50 border-amber-100 bg-opacity-85">
                <div class="flex items-center">
                    <UIcon name="i-lucide-clock" class="mr-2 text-amber-500" />
                    <span class="font-medium text-amber-700">Waiting for Payment</span>
                </div>
                <div class="mt-2 text-sm text-amber-600">
                    Please complete your payment within:
                    <span class="font-bold">{{ formatTime(remainingTime) }}</span>
                </div>
            </div>
        </template>
        <div class="w-full mx-auto overflow-hidden shadow-md rounded-xl">
            <div class="p-4 border-b">
                <div class="text-sm">Total Payment</div>
                <div class="text-2xl font-bold">Rp {{ formatCurrency(amount || 0) }}</div>
            </div>

            <div class="p-4 border-b">

                <div v-if="payment.method === 'bank_transfer'">
                    <div class="flex items-center justify-between mb-2">
                        <div class="text-sm">Virtual Account Number</div>
                        <UBadge color="primary" variant="subtle" size="lg">
                            {{ payment.bank?.toUpperCase() || 'BANK' }}
                        </UBadge>
                    </div>

                    <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div class="font-mono text-lg font-semibold">{{ payment.va_number }}</div>
                        <UButton color="primary" variant="ghost" icon="i-lucide-copy" size="sm" @click="copyVaNumber" />
                    </div>

                    <UAlert v-if="copied" class="mt-2" color="success" variant="soft" icon="i-lucide-check-circle">
                        VA number copied to clipboard!
                    </UAlert>
                </div>

                <div v-else-if="payment.method === 'qris'" class="flex flex-col items-center text-center">
                    <div class="mb-2 text-sm text-gray-500">Scan this QRIS to pay</div>
                    <div class="p-2 bg-white rounded-lg shadow-sm qr-code">
                        <img :src="payment.qris_png" />
                    </div>
                    <div class="flex gap-2 mt-3">
                        <UButton color="primary" variant="outline" size="sm" @click="downloadQRCode">
                            <UIcon name="i-lucide-download" class="mr-1" />
                            Download QR
                        </UButton>
                    </div>
                </div>

                <!-- <div v-else-if="payment.method === 'e_wallet'" class="flex flex-col items-center text-center">
                    <div class="mb-2 text-sm text-gray-500">Payment via {{ payment.bank || 'E-Wallet' }}</div>
                    <div v-if="payment.va_number" class="p-2 bg-white rounded-lg shadow-sm qr-code">
                        <NuxtImg :src="payment.qris_png" />
                    </div>
                </div> -->

                <div v-else-if="payment.method === 'cash'" class="flex flex-col items-center py-4 text-center">
                    <div class="p-3 mb-3 rounded-full bg-green-50">
                        <UIcon name="i-heroicons-banknotes" class="w-8 h-8 text-green-600" />
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Cash Payment</h3>
                    <p class="text-sm text-gray-500">
                        Please make the payment at the Secretariat / Committee.
                    </p>
                </div>

                <div v-else class="text-center text-gray-500">
                    Unknown payment method
                </div>
            </div>

            <div class="p-4" v-if="payment.method !== 'cash'">
                <h3 class="mb-3 font-medium text-gray-900">Payment Instructions</h3>
                <UAccordion :items="paymentInstructions" color="gray" icon="i-lucide-chevron-down">
                    <template #content="{ item }">
                        <div v-html="item.content" class="text-sm text-gray-600 dark:text-gray-300 pl-4"></div>
                    </template>
                </UAccordion>
            </div>
        </div>
        <template #footer>
            <div class="flex justify-between gap-3 p-4">
                <UButton block class="flex-1" @click="cancel" color="error" variant="soft">
                    Cancel
                </UButton>
                <UButton block color="primary" class="flex-1" @click="checkStatus" :loading="checking">
                    Check Status
                    <UIcon name="i-lucide-refresh-cw" class="ml-1" />
                </UButton>
            </div>
        </template>
    </UCard>

    <UCard v-else-if="payment.status === 'success'">
        <template #header>
            <div class="p-4 text-white bg-green-500 bg-opacity-75">
                <h1 class="text-xl font-semibold">Payment Success</h1>
                <p class="text-sm opacity-80">
                    Your payment has been successfully processed
                </p>
            </div>
        </template>
        <div class="w-full mx-auto overflow-hidden shadow-md rounded-xl">
            <div class="p-4 border-b">
                <div class="text-sm">Total Payment</div>
                <div class="text-2xl font-bold">Rp {{ formatCurrency(amount || 0) }}</div>
            </div>
            <div class="p-4 border-b bg-green-50">
                <div class="flex items-center justify-center py-4">
                    <UIcon name="i-lucide-check-circle" class="w-16 h-16 text-green-500" />
                </div>
                <div class="text-center text-green-700 font-medium">Transaction Successful</div>
            </div>
            <div class="p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-500">Transaction ID</div>
                    <div class="font-mono text-sm font-semibold">{{ payment.transaction_id || '-' }}</div>
                </div>
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-500">Payment Date</div>
                    <div class="font-mono text-sm font-semibold">
                        {{ payment.time ? new Date(payment.time).toLocaleString("id-ID") : '-' }}
                    </div>
                </div>
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-500">Method</div>
                    <div class="font-mono text-sm font-semibold uppercase">{{ payment.method?.replace('_', ' ') }}</div>
                </div>
            </div>
        </div>
    </UCard>

    <UCard v-else>
        <div class="p-8 text-center">
            <UIcon name="i-lucide-x-circle" class="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Payment {{ payment.status }}</h2>
            <p class="text-gray-500 mt-2">This transaction has been {{ payment.status }}.</p>
        </div>
    </UCard>
</template>

<script setup lang="ts">
import type { IPayment } from '~~/types';
import type { IPaymentResponse } from '~~/types/IResponse';

const props = defineProps({
    payment: {
        type: Object as PropType<IPayment>,
        required: true,
    },
    amount: {
        type: Number,
    },
});

const emits = defineEmits(['cancel', 'success']);

// Reactive state
const payment = ref(props.payment);
const remainingTime = ref(calculateRemainingTime());
const copied = ref(false);
const checking = ref(false);
let timer: string | number | NodeJS.Timeout | undefined = undefined;


// Dynamic Instructions based on Payment Method
const paymentInstructions = computed(() => {
    if (payment.value.method === 'bank_transfer') {
        const bankName = payment.value.bank?.toUpperCase() || 'Bank';
        return [
            {
                label: `Mobile Banking ${bankName}`,
                icon: "i-lucide-smartphone",
                defaultOpen: true,
                content: `<ol class="pl-5 space-y-1 list-decimal">
                    <li>Login to <b>${bankName} Mobile</b></li>
                    <li>Select <b>m-Transfer</b> > <b>Virtual Account</b></li>
                    <li>Enter VA Number: <b>${payment.value.va_number}</b></li>
                    <li>Check details and confirm PIN</li>
                </ol>`,
            },
            {
                label: `ATM ${bankName}`,
                icon: "i-lucide-credit-card",
                content: `<ol class="pl-5 space-y-1 list-decimal">
                    <li>Insert Card & PIN</li>
                    <li>Select <b>Other Trans</b> > <b>Transfer</b> > <b>Virtual Account</b></li>
                    <li>Enter VA Number: <b>${payment.value.va_number}</b></li>
                    <li>Confirm payment</li>
                </ol>`,
            }
        ];
    }

    if (payment.value.method === 'qris') {
        return [
            {
                label: "How to Pay with QRIS",
                icon: "i-heroicons-qr-code",
                defaultOpen: true,
                content: `<ol class="pl-5 space-y-1 list-decimal">
                    <li>Open any payment app (GoPay, OVO, ShopeePay, Mobile Banking)</li>
                    <li>Select <b>Scan QR</b> menu</li>
                    <li>Scan the QR code above</li>
                    <li>Check the merchant name and amount</li>
                    <li>Confirm payment</li>
                </ol>`
            }
        ];
    }

    if (payment.value.method === 'e_wallet') {
        return [
            {
                label: `Pay with ${payment.value.bank || 'E-Wallet'}`,
                icon: "i-lucide-wallet",
                defaultOpen: true,
                content: `Please follow the instructions in your ${payment.value.bank} application.`
            }
        ]
    }

    return [];
});

function calculateRemainingTime() {
    const now = Date.now();
    if (!props.payment.expiry) return 0;
    return Math.max(0, new Date(props.payment.expiry).getTime() - now);
}

function formatTime(ms: number) {
    if (ms <= 0) return "00:00:00";
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return [
        hours.toString().padStart(2, "0"),
        minutes.toString().padStart(2, "0"),
        seconds.toString().padStart(2, "0"),
    ].join(":");
}

function formatCurrency(value: { toString: () => string } | number) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function copyVaNumber() {
    if (!navigator.clipboard || !payment.value.va_number) return;
    navigator.clipboard.writeText(payment.value.va_number)
        .then(() => {
            copied.value = true;
            setTimeout(() => copied.value = false, 3000);
        })
        .catch(console.error);
}

async function checkStatus() {
    if (!payment.value.transaction_id) return;
    checking.value = true;
    try {
        const response = await $fetch<IPaymentResponse>('/api/payment', {
            method: "GET",
            query: { transaction_id: payment.value.transaction_id },
        });

        if (response.data?.payment) {
            payment.value.status = response.data.payment.status;
            if (payment.value.status === 'success') {
                emits('success');
                if (timer) clearInterval(timer);
            }
        }
    } catch (error) {
        console.error("Status check failed", error);
    } finally {
        checking.value = false;
    }
}

async function cancel() {
    if (!confirm('Are you sure you want to cancel this payment?')) return;
    try {
        const response = await $fetch<IPaymentResponse>('/api/payment', {
            method: "DELETE",
            query: { transaction_id: payment.value.transaction_id },
        });
        if (response.statusCode === 200) {
            payment.value.status = 'canceled';
            emits('cancel');
        }
    } catch (error) {
        console.error("Cancellation failed", error);
    }
}

function downloadQRCode() {

}

// Lifecycle
onMounted(() => {
    timer = setInterval(() => {
        remainingTime.value = calculateRemainingTime();
        if (remainingTime.value <= 0) clearInterval(timer);
    }, 1000);
});

onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
});

// Auto polling every 10s if pending
const { pause, resume } = useIntervalFn(() => {
    if (payment.value.status === 'pending') {
        checkStatus();
    } else {
        pause();
    }
}, 10000);

</script>

<style scoped>
.bg-primary {
    background-color: #0f766e;
}
</style>
