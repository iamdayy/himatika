<template>
    <UCard v-if="payment.status === 'pending' || payment.status === 'verifying'"
        :ui="{ root: 'ring-1 ring-gray-200 dark:ring-gray-800 shadow-xl rounded-3xl', body: 'p-0 sm:p-0', header: 'p-0 sm:p-0' }">
        <template #header>
            <div
                class="bg-gradient-to-br from-primary-600 to-indigo-700 p-5 md:p-6 text-white relative overflow-hidden">
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
                            <div
                                class="font-mono text-xl sm:text-2xl font-black tracking-widest text-gray-900 dark:text-white break-all pr-2">
                                {{
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

                <div v-else-if="payment.method === 'manual_transfer'">
                    <div class="flex items-center justify-between mb-3">
                        <div class="text-sm font-semibold text-gray-700 dark:text-gray-300">Transfer Manual ke Rekening/E-Wallet</div>
                        <UBadge color="primary" variant="soft" size="md" class="uppercase font-bold tracking-wider">
                            {{ payment.bank || 'BANK' }}
                        </UBadge>
                    </div>

                    <div class="relative group">
                        <div class="flex flex-col p-4 rounded-2xl bg-white dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 group-hover:border-primary-400 transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
                            <div class="text-sm text-gray-500 mb-1">Atas Nama: <span class="font-bold text-gray-900 dark:text-white">{{ payment.biller_code }}</span></div>
                            <div class="flex items-center justify-between cursor-pointer" @click="copyVaNumber">
                                <div class="font-mono text-xl sm:text-2xl font-black tracking-widest text-gray-900 dark:text-white break-all pr-2">
                                    {{ payment.va_number }}
                                </div>
                                <UButton color="primary" variant="ghost" icon="i-heroicons-clipboard-document" size="md"
                                    class="group-hover:scale-110 transition-transform" />
                            </div>
                        </div>
                    </div>

                    <UAlert v-if="copied" class="mt-3 animate-in fade-in slide-in-from-top-2" color="success"
                        variant="soft" icon="i-heroicons-check-circle-solid" title="Disalin!">
                        Nomor rekening/e-wallet berhasil disalin ke clipboard.
                    </UAlert>

                    <UAlert color="warning" variant="subtle" icon="i-heroicons-information-circle" class="mt-3" title="Perhatian">
                        Lakukan transfer tepat sesuai nominal dan simpan bukti transfer untuk dikonfirmasi ke panitia jika diperlukan.
                    </UAlert>

                    <div v-if="registeredId && agendaId" class="mt-6 p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <div class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <UIcon name="i-heroicons-arrow-up-tray" class="w-5 h-5 text-primary-500" />
                            Upload Bukti Transfer
                        </div>
                        
                        <!-- Show uploaded proof if it exists -->
                        <div v-if="payment.proof_url" class="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-3 group">
                            <img :src="payment.proof_url" class="w-full h-auto max-h-48 object-contain bg-white dark:bg-gray-900" alt="Bukti Transfer" />
                        </div>
                        
                        <div v-if="payment.status === 'pending'" class="flex flex-col gap-2">
                            <UInput type="file" accept="image/*" @change="handleProofUpload" :loading="uploading" :disabled="uploading" />
                        </div>
                    </div>
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
            <div class="flex flex-col sm:flex-row justify-between gap-3 p-4">
                <UButton block class="flex-1" @click="cancel" color="error" variant="soft">
                    Batal
                </UButton>
                <UButton v-if="payment.method !== 'manual_transfer'" block color="primary" class="flex-1" @click="checkStatus" :loading="checking">
                    Cek Status
                    <UIcon name="i-lucide-refresh-cw" class="ml-1" />
                </UButton>
                <UButton v-else block color="warning" class="flex-1 flex gap-2" variant="soft" disabled>
                    <UIcon name="i-heroicons-clock" class="w-5 h-5" />
                    Menunggu Verifikasi Admin
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
import imageCompression from 'browser-image-compression';
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
    registeredId: {
        type: String,
        required: false,
    },
    agendaId: {
        type: String,
        required: false,
    }
});

const emits = defineEmits(['cancel', 'success']);
const toast = useToast();

// Reactive state
const payment = ref(props.payment);
const uploading = ref(false);
const remainingTime = ref(calculateRemainingTime());
const copied = ref(false);
const checking = ref(false);
let timer: string | number | NodeJS.Timeout | undefined = undefined;

const handleProofUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target && target.files && target.files.length > 0) {
        const file = target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            toast.add({ title: 'Gagal', description: 'File harus berupa gambar', color: 'error' });
            return;
        }

        const options = {
            maxSizeMB: 1, 
            maxWidthOrHeight: 1200,
            useWebWorker: true,
        };
        
        try {
            uploading.value = true;
            const compressedFile = await imageCompression(file, options);
            
            const formData = new FormData();
            formData.append('proof', compressedFile, compressedFile.name || 'proof.png');
            
            const response = await $fetch<any>(`/api/agenda/${props.agendaId}/payment/${props.registeredId}/proof`, {
                method: 'POST',
                body: formData,
            });
            
            if (response.statusCode === 200) {
                payment.value.proof_url = response.data?.payment?.proof_url;
                payment.value.status = 'verifying';
                toast.add({ title: 'Berhasil', description: 'Bukti transfer berhasil diunggah.', color: 'success' });
            } else {
                throw new Error(response.statusMessage || 'Gagal mengunggah bukti');
            }
        } catch (error: any) {
            toast.add({ title: 'Gagal', description: error.message || 'Terjadi kesalahan saat mengunggah bukti transfer', color: 'error' });
        } finally {
            uploading.value = false;
        }
    }
}


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

    if (payment.value.method === 'manual_transfer') {
        const bankName = payment.value.bank?.toUpperCase() || 'Bank / E-Wallet';
        return [
            {
                label: `Transfer ke ${bankName}`,
                icon: "i-lucide-smartphone",
                defaultOpen: true,
                content: `<ol class="pl-5 space-y-1 list-decimal">
                    <li>Buka aplikasi Mobile Banking atau E-Wallet Anda</li>
                    <li>Pilih menu Transfer ke Rekening / E-Wallet</li>
                    <li>Masukkan Nomor Tujuan: <b>${payment.value.va_number}</b></li>
                    <li>Pastikan nama penerima adalah: <b>${payment.value.biller_code}</b></li>
                    <li>Masukkan nominal transfer: <b>Rp ${formatCurrency(props.amount || 0)}</b></li>
                    <li>Selesaikan pembayaran dan <b>simpan tangkapan layar (screenshot) bukti transfer</b></li>
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
