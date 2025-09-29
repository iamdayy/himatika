<template>
    <UCard v-if="payment.status === 'pending'">
        <template #header>
            <!-- Header -->
            <div class="p-4 text-white bg-opacity-75 bg-primary">
                <h1 class="text-xl font-semibold">Payment Details</h1>
                <p class="text-sm opacity-80">
                    Complete your payment before the time expires
                </p>
            </div>

            <!-- Payment Status -->
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
            <!-- Payment Amount -->
            <div class="p-4 border-b">
                <div class="text-sm">Total Payment</div>
                <div class="text-2xl font-bold">Rp {{ formatCurrency(amount || 0) }}</div>
            </div>

            <!-- Payment Method Tabs -->
            <div class="p-4 border-b">
                <div class="flex mb-4 border-b">
                    <button class="px-4 py-2 mr-2 text-sm font-medium" :class="paymentMethod === 'va'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-500 dark:text-gray-300'
                        " @click="paymentMethod = 'va'">
                        Virtual Account
                    </button>
                    <button class="px-4 py-2 text-sm font-medium" :class="paymentMethod === 'qr'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-500 dark:text-gray-300'
                        " @click="paymentMethod = 'qr'">
                        QR Code
                    </button>
                </div>

                <!-- Virtual Account Details -->
                <div v-if="paymentMethod === 'va'">
                    <div class="flex items-center justify-between mb-2">
                        <div class="text-sm">Virtual Account Number</div>
                        <UBadge color="secondary" variant="subtle" size="lg">{{
                            payment.bank?.toLocaleUpperCase()
                            }}</UBadge>
                    </div>

                    <div class="flex items-center justify-between p-3 rounded-lg">
                        <div class="font-mono text-lg font-semibold">{{ payment.va_number }}</div>
                        <UButton color="primary" variant="ghost" icon="i-lucide-copy" size="sm" @click="copyVaNumber" />
                    </div>

                    <UAlert v-if="copied" class="mt-2" color="success" variant="soft" icon="i-lucide-check-circle">
                        VA number copied to clipboard!
                    </UAlert>
                </div>

                <!-- QR Code Details -->
                <div v-else class="flex flex-col items-center">
                    <div class="mb-2 text-sm text-gray-500">Scan this QR code to pay</div>

                    <Qrcode :value="qrValue" class="max-w-md" />

                    <UButton class="mt-3" color="primary" variant="outline" size="sm" @click="downloadQRCode">
                        <UIcon name="i-lucide-download" class="mr-1" />
                        Download QR Code
                    </UButton>
                </div>
            </div>

            <!-- Payment Instructions -->
            <div class="p-4">
                <h3 class="mb-3 font-medium text-gray-900">Payment Instructions</h3>
                <UAccordion :items="paymentInstructions" color="gray" icon="i-lucide-chevron-down">
                    <template #content="{ item }">
                        <div v-html="item.content"></div>
                    </template>
                </UAccordion>
            </div>
        </div>
        <template #footer>
            <!-- Action Buttons -->
            <div class="flex justify-between gap-3 p-4">
                <UButton block class="flex-1" @click="cancel" color="error">
                    Cancel
                </UButton>
                <UButton block color="primary" class="flex-1" @click="checkStatus">
                    Check Status
                    <UIcon name="i-lucide-refresh-cw" class="ml-1" />
                </UButton>
            </div>
        </template>
    </UCard>
    <UCard v-else-if="payment.status === 'success'">
        <template #header>
            <!-- Header -->
            <div class="p-4 text-white bg-green-500 bg-opacity-75">
                <h1 class="text-xl font-semibold">Payment Success</h1>
                <p class="text-sm opacity-80">
                    Your payment has been successfully processed
                </p>
            </div>
        </template>
        <div class="w-full mx-auto overflow-hidden shadow-md rounded-xl">
            <!-- Payment Amount -->
            <div class="p-4 border-b">
                <div class="text-sm">Total Payment</div>
                <div class="text-2xl font-bold">Rp {{ formatCurrency(amount || 0) }}</div>
            </div>

            <!-- Payment Status -->
            <div class="p-4 border-b">
                <div class="flex items-center">
                    <UIcon name="i-lucide-check-circle" class="mr-2 text-green-500" />
                    <span class="font-medium text-green-700">Payment Success</span>
                </div>
            </div>

            <!-- Payment Details -->
            <div class="p-4">
                <div class="flex items-center justify-between mb-2">
                    <div class="text-sm">Transaction ID</div>
                    <div class="font-mono text-lg font-semibold">{{ payment.transaction_id }}</div>
                </div>
                <div class="flex items-center justify-between mb-2">
                    <div class="text-sm">Payment Date</div>
                    <div class="font-mono text-lg font-semibold">{{ new Date(payment.time as
                        Date).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" }) }}</div>
                </div>
                <div class="flex items-center justify-between mb-2">
                    <div class="text-sm">Payment Method</div>
                    <div class="font-mono text-lg font-semibold">{{ payment.method }}</div>
                </div>
            </div>
        </div>
    </UCard>
</template>

<script setup lang="ts">
import type { IPayment } from '~/types';
import type { IPaymentResponse } from '~/types/IResponse';

// Props with default values
const props = defineProps({
    payment: {
        type: Object as PropType<IPayment>,
        required: true,
    },
    amount: {
        type: Number,
    },
});

// Reactive state
const remainingTime = ref(calculateRemainingTime());
let timer: string | number | NodeJS.Timeout | undefined = undefined;
const copied = ref(false);
const payment = ref(props.payment);
const paymentMethod = ref("va"); // 'va' or 'qr'
const emits = defineEmits(['cancel'])
// Payment instructions accordion items
const paymentInstructions = computed(() => [
    {
        label: "Mobile Banking",
        icon: "i-lucide-smartphone",
        defaultOpen: true,
        content: `<ol class="pl-5 space-y-2 text-sm list-decimal"><li>Login to your ${props.payment.bank} Mobile Banking app</li><li>Select "Transfer" menu</li><li>Select "Virtual Account"</li><li>Enter the VA Number: ${props.payment.va_number}</li><li>Confirm the payment details and complete the transaction</li></ol>`,
    },
    {
        label: "Internet Banking",
        icon: "i-lucide-globe",
        content: `
            <ol class="pl-5 space-y-2 text-sm list-decimal">
              <li>Login to your ${props.payment.bank} Internet Banking</li>
              <li>Select "Transfer" menu</li>
              <li>Select "Transfer to Virtual Account"</li>
              <li>Enter the VA Number: ${props.payment.va_number}</li>
              <li>Confirm the payment details and complete the transaction</li>
            </ol>
          `,
    },
    {
        label: "ATM",
        icon: "i-lucide-credit-card",
        content: `
            <ol class="pl-5 space-y-2 text-sm list-decimal">
              <li>Insert your ${props.payment.bank} ATM card and enter your PIN</li>
              <li>Select "Other Transactions"</li>
              <li>Select "Transfer"</li>
              <li>Select "To Virtual Account"</li>
              <li>Enter the VA Number: ${props.payment.va_number}</li>
              <li>Confirm the payment details and complete the transaction</li>
            </ol>
          `,
    },
]);

// QR code value
const qrValue = computed(() => {
    // This would typically be a formatted string according to the payment provider's specifications
    // For example: BCA uses a specific format for their QR codes
    return `${props.payment.bank}:${props.payment.va_number}:${props.amount}:${props.payment.order_id}`;
});

// Methods
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

function formatCurrency(value: { toString: () => string }) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function copyVaNumber() {
    if (!navigator.clipboard) {
        console.error("Clipboard API not available");
        return;
    }
    if (!props.payment.va_number) return;
    navigator.clipboard
        .writeText(props.payment.va_number)
        .then(() => {
            copied.value = true;
            setTimeout(() => {
                copied.value = false;
            }, 3000);
        })
        .catch((err) => {
            console.error("Failed to copy: ", err);
        });
}

async function checkStatus() {
    try {
        const response = await $fetch<IPaymentResponse>('/api/payment', {
            method: "GET",
            query: { transaction_id: props.payment.transaction_id },
        });
        payment.value.status = response.data.payment.status;
    }
    catch (error) {
        console.error("Failed to check payment status: ", error);
    }
}
async function cancel() {
    try {
        const response = await $fetch<IPaymentResponse>('/api/payment', {
            method: "DELETE",
            query: { transaction_id: props.payment.transaction_id },
        });
        if (response.statusCode === 200) {
            payment.value.status = 'canceled';
            emits("cancel");
        }
    }
    catch (error) {
        console.error("Failed to check payment status: ", error);
    }
}

function downloadQRCode() {
    const canvas = document.querySelector(".qr-code canvas");
    if (canvas) {
        const link = document.createElement("a");
        link.download = `payment-qr-${props.payment.order_id}.png`;
        link.href = (canvas as HTMLCanvasElement).toDataURL("image/png");
        link.click();
    }
}

// Lifecycle hooks
onMounted(() => {
    // Update the countdown every second
    timer = setInterval(() => {
        remainingTime.value = calculateRemainingTime();
        if (remainingTime.value <= 0) {
            clearInterval(timer);
        }
    }, 1000);
});

onBeforeUnmount(() => {
    if (timer) {
        clearInterval(timer);
    }
});
useIntervalFn(() => {
    checkStatus();
}, 10000)
</script>

<style scoped>
.bg-primary {
    background-color: #0f766e;
}

.text-primary {
    color: #0f766e;
}
</style>
