<template>
    <UCard v-if="payment.status === 'pending'"
        :ui="{ root: 'ring-1 ring-gray-200 dark:ring-gray-800 shadow-xl rounded-3xl', body: 'p-0 sm:p-0', header: 'p-0 sm:p-0' }">
        <template #header>
            <div class="bg-gradient-to-br from-primary-600 to-indigo-700 p-5 md:p-6 text-white relative overflow-hidden">
                <div class="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <h1 class="text-2xl font-black tracking-tight mb-1">Payment Details</h1>
                <p class="text-primary-100 text-sm">
                    Complete your payment before the time expires
                </p>
            </div>

            <div
                class="p-4 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div class="flex items-center">
                    <div class="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-lg mr-3">
                        <UIcon name="i-heroicons-clock-solid"
                            class="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
                    </div>
                    <div>
                        <span class="font-bold text-amber-800 dark:text-amber-300 block text-sm">Waiting for
                            Payment</span>
                        <span class="text-xs text-amber-600 dark:text-amber-500">Please complete your payment</span>
                    </div>
                </div>
                <div
                    class="bg-white dark:bg-gray-900 px-4 py-2 rounded-xl shadow-sm border border-amber-100 dark:border-amber-800 flex items-center justify-center">
                    <span class="font-mono font-black text-xl text-amber-600 dark:text-amber-500 tracking-wider">{{
                        formatTime(remainingTime) }}</span>
                </div>
            </div>
        </template>
        <div class="w-full mx-auto">
            <div class="p-5 md:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
                <div class="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-1">Total
                    Payment
                </div>
                <div
                    class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400">
                    Rp {{ formatCurrency(amount || 0) }}</div>
            </div>

            <div class="p-4 border-b">

                <div v-if="payment.method === 'bank_transfer'">
                    <div class="flex items-center justify-between mb-3">
                        <div class="text-sm font-semibold text-gray-700 dark:text-gray-300">Virtual Account Number</div>
                        <UBadge color="primary" variant="soft" size="md" class="uppercase font-bold tracking-wider">
                            {{ payment.bank || 'BANK' }}
                        </UBadge>
                    </div>

                    <div class="relative group">
                        <div class="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 group-hover:border-primary-400 transition-colors cursor-pointer shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
                            @click="copyVaNumber">
                            <div class="font-mono text-xl sm:text-2xl font-black tracking-widest text-gray-900 dark:text-white break-all pr-2">{{
                                payment.va_number }}</div>
                            <UButton color="primary" variant="ghost" icon="i-heroicons-clipboard-document" size="md"
                                class="group-hover:scale-110 transition-transform" />
                        </div>
                    </div>

                    <UAlert v-if="copied" class="mt-3 animate-in fade-in slide-in-from-top-2" color="success"
                        variant="soft" icon="i-heroicons-check-circle-solid" title="Disalin!">
                        Nomor VA berhasil disalin ke clipboard.
                    </UAlert>
                </div>

                <div v-else-if="payment.method === 'qris'" class="flex flex-col items-center text-center">
                    <div class="mb-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Scan QRIS ini untuk
                        membayar</div>
                    <div
                        class="relative p-1 rounded-3xl bg-gradient-to-br from-primary-400 via-indigo-500 to-purple-500 shadow-xl shadow-primary-500/20 group">
                        <div class="bg-white p-4 rounded-[22px]">
                            <img :src="payment.qris_png"
                                class="w-48 h-48 sm:w-64 sm:h-64 object-contain group-hover:scale-105 transition-transform duration-500"
                                alt="QRIS" />
                        </div>
                    </div>
                    <div class="mt-6">
                        <UButton color="primary" variant="solid" size="lg" icon="i-heroicons-arrow-down-tray"
                            @click="downloadQRCode"
                            class="shadow-md hover:shadow-lg transition-all rounded-full px-6 font-bold">
                            Unduh QR Code
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

            <div class="p-5 md:p-6" v-if="payment.method !== 'cash'">
                <h3 class="mb-4 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <UIcon name="i-heroicons-book-open" class="w-5 h-5 text-primary-500" />
                    Cara Pembayaran
                </h3>
                <UAccordion :items="paymentInstructions" color="gray" variant="soft" size="lg"
                    class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 p-2">
                    <template #content="{ item }">
                        <div v-html="item.content"
                            class="text-sm text-gray-600 dark:text-gray-300 p-4 bg-white dark:bg-gray-900 rounded-xl mt-2 prose dark:prose-invert max-w-none prose-sm">
                        </div>
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

    <UCard v-else-if="payment.status === 'success'"
        :ui="{ root: 'ring-1 ring-green-200 dark:ring-green-900 shadow-2xl shadow-green-500/10 rounded-3xl', body: 'p-0 sm:p-0', header: 'p-0 sm:p-0' }">
        <template #header>
            <div class="p-5 md:p-6 text-white bg-gradient-to-r from-green-500 to-emerald-600 relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl"></div>
                <h1 class="text-2xl font-black tracking-tight mb-1 relative z-10">Payment Success</h1>
                <p class="text-green-100 text-sm relative z-10">
                    Your payment has been successfully processed
                </p>
            </div>
        </template>
        <div class="w-full mx-auto bg-white dark:bg-gray-900">
            <div class="p-6 md:p-8 text-center border-b border-gray-100 dark:border-gray-800 relative">
                <!-- Watermark -->
                <div class="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                    <UIcon name="i-heroicons-check-badge-solid" class="w-64 h-64" />
                </div>

                <div class="inline-flex items-center justify-center py-4 relative z-10 animate-in zoom-in duration-500">
                    <div class="absolute inset-0 bg-green-500 blur-xl opacity-30 rounded-full"></div>
                    <UIcon name="i-heroicons-check-circle-solid" class="w-20 h-20 text-green-500 relative" />
                </div>
                <div
                    class="text-center text-green-600 dark:text-green-400 font-black text-xl mt-2 tracking-wide uppercase relative z-10">
                    Transaction Successful</div>
            </div>

            <div class="p-6 md:p-8 bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-800">
                <div
                    class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-2 text-center">
                    Total Paid</div>
                <div class="text-4xl font-black text-center text-gray-900 dark:text-white">Rp {{ formatCurrency(amount
                    || 0)
                    }}</div>
            </div>

            <div class="p-6 md:p-8 space-y-4 relative">
                <!-- Receipt Cutout Top -->
                <div
                    class="absolute -top-3 left-8 right-8 h-px border-t border-dashed border-gray-300 dark:border-gray-700">
                </div>

                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-500 font-medium">Transaction ID</div>
                    <div class="font-mono text-sm font-bold bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg">{{
                        payment.transaction_id || '-' }}</div>
                </div>
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-500 font-medium">Payment Date</div>
                    <div class="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">
                        {{ payment.time ? new Date(payment.time).toLocaleString("id-ID") : '-' }}
                    </div>
                </div>
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-500 font-medium">Method</div>
                    <div
                        class="font-mono text-sm font-bold text-gray-900 dark:text-gray-100 uppercase bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg">
                        {{ payment.method?.replace('_', ' ') }}</div>
                </div>
            </div>
        </div>
    </UCard>

    <UCard v-else>
        <div class="p-6 md:p-8 text-center">
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
            emits("cancel");
        }
    } catch (error) {
        console.error("Cancellation failed", error);
    }
}

function downloadQRCode() {
    if (!payment.value.qris_png) return;
    const link = document.createElement('a');
    link.href = payment.value.qris_png;
    link.download = `QRIS-${payment.value.transaction_id || 'payment'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
