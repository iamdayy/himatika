<script setup lang='ts'>
import type { IAgenda, ICommittee, IPayment, IPaymentMethod } from '~~/types';
import type { FieldValidationRules, FormError, Step } from '~~/types/component/stepper';
import type { IPaymentBody } from '~~/types/IRequestPost';
import type { IAgendaRegisterResponse, IAgendaResponse, IAnswersResponse, ICommitteeResponse } from '~~/types/IResponse';

// --- TYPE DEFINITIONS ---
interface IFormData {
    payment: IPayment & {
        bank: string;
    };
    confirmation: {}
}
interface IFormRegistration {
    job: string;
}

// --- PAGE META ---
definePageMeta({
    layout: 'client',
    middleware: ['sidebase-auth'],
});

// --- COMPOSABLES & UTILS ---
const route = useRoute();
const router = useRouter();
const toast = useToast();
const { id } = route.params as { id: string; };
const { tab } = route.query as { tab: string; };
const { $api } = useNuxtApp();
const { width } = useWindowSize();
const { $ts } = useI18n();
const { data: user } = useAuth();

// --- STATE ---
const isMobile = computed(() => width.value < 768);
const activeStep = ref(0);

// --- FETCH DATA ---
const { data: agendaData, pending: pendingAgenda } = useLazyAsyncData(() => $api<IAgendaResponse>(`/api/agenda/${id}`, {
    method: 'GET',
}));

const { data: committeeData, refresh: refreshCommittee, pending: pendingCommittee } = useLazyAsyncData(() => $api<ICommitteeResponse>(`/api/agenda/${id}/committee/me`, {
    method: 'GET',
}), {
    transform: (data) => {
        if (!data.data?.committee) return null;
        return data.data.committee;
    }
});

// --- COMPUTED DATA ---
const agenda = computed<IAgenda | undefined>(() => agendaData.value?.data?.agenda);
const committee = computed<ICommittee | undefined>(() => {
    if (!committeeData.value) return {
        _id: '',
        agendaId: id,
        job: '',
        payment: {
            _id: '',
            method: 'cash',
            amount: 0,
            proof: '',
            status: 'pending',
            createdAt: '',
            updatedAt: '',
        },
        approved: false,
        member: user.value?.member,
    };
    return committeeData.value;
});
const registrationId = computed(() => committee.value?._id);

// --- QUESTIONS ---
const { data: questions, pending: pendingQuestions } = useLazyAsyncData(() => $api<IAnswersResponse>(`/api/agenda/${id}/committee/question/answer/${registrationId.value}`, {
    method: 'GET',
}), {
    transform: (data) => data.data?.answers,
    default: () => [],
    watch: [registrationId],
});

// --- BREADCRUMBS ---
const links = computed(() => [
    { label: $ts('home'), to: '/' },
    { label: $ts('agenda'), to: '/agendas' },
    { label: agenda.value?.title || '', to: `/agendas/${id}` },
    { label: $ts('register') }
]);

// --- STEPS CONFIGURATION ---
const steps = computed<Step[]>(() => {
    const stepsList: Step[] = [
        {
            id: 'registration',
            label: $ts('register'),
            title: $ts('register'),
            formData: formRegistration,
            validationRules: validationRuleRegistration,
            onNext: committee.value?._id ? refreshCommittee : register
        },
        {
            id: 'answer_question',
            label: $ts('answer_question'),
            title: $ts('answer_question'),
            formData: {},
            validationRules: {},
            onNext: undefined
        },
        {
            id: 'select_payment',
            label: $ts('select_payment'),
            title: $ts('select_payment'),
            formData: formPayment,
            validationRules: validationRulePayment,
            onNext: formPayment.method !== 'cash' ? payment : undefined
        },
        {
            id: 'payment',
            label: $ts('payment'),
            title: $ts('payment'),
            formData: {}, // No form validation needed here, just viewing details
            validationRules: {}
        },
        {
            id: 'success',
            label: $ts('success'),
            title: $ts('success'),
            formData: {}
        }
    ];

    return stepsList.filter(step => {
        if (step.id === 'answer_question') {
            return agenda.value?.configuration?.committee?.questions && agenda.value?.configuration?.committee?.questions.length > 0;
        }
        if (step.id === 'select_payment') {
            // Skip payment selection if already paid or no payment required
            const isPaid = committee.value?.payment?.status === 'success' || committee.value?.payment?.status === 'pending';
            return agenda.value?.configuration?.committee?.pay && !isPaid;
        }
        if (step.id === 'payment') {
            // Show payment detail if payment is required
            return agenda.value?.configuration?.committee?.pay;
        }
        return true;
    });
});

// --- FORMS ---
const jobAvailablesItems = computed(() => {
    return agenda.value?.configuration.committee.jobAvailables?.map((item) => ({
        label: item.label,
        value: item.label,
    })) || [];
});

const formRegistration = reactive({
    job: committee.value?.job || '',
});

const formPayment = reactiveComputed(() => ({
    method: committee.value?.payment?.method || 'bank_transfer',
    status: committee.value?.payment?.status || 'pending',
    order_id: committee.value?.payment?.order_id || '',
    transaction_id: committee.value?.payment?.transaction_id || '',
    bank: committee.value?.payment?.bank || 'bca',
    va_number: committee.value?.payment?.va_number || '',
    time: committee.value?.payment?.time || new Date(),
    expiry: committee.value?.payment?.expiry || new Date(),
    qris_png: committee.value?.payment?.qris_png || '',
}));

// --- CONSTANTS & OPTIONS ---
const paymentMethods = ref<{ label: string; value: IPaymentMethod; icon: string; }[]>([
    { label: $ts('cash'), value: 'cash', icon: 'i-heroicons-banknotes' },
    { label: $ts('transfer'), value: 'bank_transfer', icon: 'i-heroicons-credit-card' },
    { label: $ts('qris'), value: 'qris', icon: 'i-heroicons-qr-code' }
]);
const vaBanks = [
    { label: 'BCA', value: 'bca' },
    { label: 'BNI', value: 'bni' },
    { label: 'BRI', value: 'bri' },
    { label: 'Mandiri', value: 'mandiri' },
    { label: 'Permata', value: 'permata' },
];


// --- ADMIN FEE CALCULATION ---
const FEES = {
    VA: 4000,
    QRIS: 0.007,
    Cash: 0
};

const priceSummary = computed(() => {
    const basePrice = agenda.value?.configuration.committee.amount || 0;
    let adminFee = 0;

    if (formPayment.method === 'bank_transfer') {
        adminFee = FEES.VA;
    } else if (formPayment.method === 'qris') {
        adminFee = Math.ceil(basePrice * FEES.QRIS);
    } else if (formPayment.method === 'cash') {
        adminFee = FEES.Cash;
    }

    return {
        base: basePrice,
        admin: adminFee,
        total: basePrice + adminFee
    };
});

// --- HELPER FUNCTIONS ---
function formatCurrency(value: number) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// --- ACTIONS ---

const register = async (): Promise<boolean | FormError> => {
    try {
        const { data, statusCode } = await $api<IAgendaRegisterResponse>(`/api/agenda/${id}/committee/register`, {
            method: 'POST',
            body: { job: formRegistration.job }
        });
        if (statusCode === 200 && data) {
            toast.add({
                title: $ts('success'),
                description: 'Tautan akses kepanitiaan dan status pembayaran telah dikirim ke email Anda.',
                color: 'success',
            });
            refreshCommittee();
            return true;
        }
        toast.add({
            title: $ts('failed'),
            description: $ts('failed_to_register'),
            color: 'error',
        });
        return false;
    } catch (error: any) {
        toast.add({
            title: $ts('failed'),
            description: error?.data?.statusMessage || error?.data?.message || error?.statusMessage || error?.message || $ts('failed_to_register'),
            color: 'error',
        });
        return false;
    }
}

const payment = async (): Promise<boolean | FormError> => {

    try {
        const { data, statusCode } = await $fetch<IAgendaRegisterResponse>(`/api/agenda/${id}/committee/register/${registrationId.value}/payment`, {
            method: 'POST',
            body: {
                payment_method: formPayment.method,
                bank_transfer: formPayment.bank,
            } as IPaymentBody
        });
        if (statusCode === 200 && data) {
            refreshCommittee();
            return true;
        }
        toast.add({
            title: $ts('failed'),
            description: $ts('failed_to_register_payment'),
            color: 'error',
        });
        return false;
    } catch (error: any) {
        toast.add({
            title: $ts('failed'),
            description: error?.data?.statusMessage || error?.data?.message || error?.statusMessage || error?.message || $ts('failed_to_register_payment'),
            color: 'error',
        });
        return false;
    }
}

const onCancelPayment = async () => {
    refreshCommittee();
    const stepIndex = steps.value.findIndex(s => s.id === 'select_payment');
    if (stepIndex !== -1) {
        activeStep.value = stepIndex;
    } else {
        activeStep.value = 1;
    }
}

// --- VALIDATION RULES ---
const validationRuleRegistration: FieldValidationRules<IFormRegistration> = reactiveComputed(() => ({
    job: (value: string) => value ? null : { message: $ts('job_required'), path: 'job' },
}));

const validationRulePayment: FieldValidationRules = reactiveComputed(() => ({
    method: (value: string) => value ? null : { message: $ts('payment_method_required'), path: 'method' },
    // Custom validation logic if needed
}));

const onCompleted = async () => {
    router.push(`/agendas/${id}/committee`);
}

// --- LIFECYCLE ---
onMounted(() => {
    watchEffect(() => {
        if (committee.value?.job) formRegistration.job = committee.value.job;
    });

    setTimeout(() => {
        const stepMap: Record<string, number> = {
            'register': 0,
            'select_payment': steps.value.findIndex(s => s.id === 'select_payment'),
            'payment': steps.value.findIndex(s => s.id === 'payment'),
            'success': steps.value.findIndex(s => s.id === 'success'),
        };

        // Auto jump if payment exists and is pending
        if (committee.value?.payment?.status === 'pending' && activeStep.value === 0) {
            activeStep.value = steps.value.findIndex(s => s.id === 'payment');
        } else if (tab && stepMap[tab] !== undefined) {
            activeStep.value = stepMap[tab];
        }
    }, 500);
});
</script>

<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :links="links" />
        <div v-if="pendingAgenda || pendingCommittee" class="mt-4">
            <USkeleton class="w-full h-12 mb-6" />
            <UCard>
                <div class="space-y-4">
                    <USkeleton class="h-8 w-1/4 mb-4" />
                    <USkeleton class="h-10 w-full" />
                    <USkeleton class="h-10 w-full" />
                    <USkeleton class="h-10 w-full" />
                </div>
            </UCard>
        </div>
        <CoreStepper v-else :steps="steps" v-model="activeStep" validate-on-change @complete="onCompleted"
            :prev-button-text="$ts('previous')" :next-button-text="$ts('next')" :complete-button-text="$ts('complete')">

            <template #default="{ step, errors }">

                <div v-if="step?.id === 'registration'">
                    <UAlert v-if="committee?._id" color="success" :title="$ts('already_committee')"
                        :description="$ts('already_committee_desc')" class="mb-4"></UAlert>
                    <Useparator class="my-4" />
                    <div class="text-start">
                        <div
                            class="space-y-6 bg-white/50 dark:bg-gray-800/30 backdrop-blur-xl p-4 md:p-6 rounded-3xl shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
                            <div class="grid grid-cols-1 gap-4 px-2 md:px-4">
                                <UFormField class="col-span-full" :label="$ts('job')" :error="errors.job?.message">
                                    <URadioGroup v-model="formRegistration.job" :items="jobAvailablesItems" />
                                </UFormField>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else-if="step?.id === 'answer_question'"
                    class="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div class="mb-6 px-2">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white">Informasi Tambahan</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Lengkapi form berikut untuk mempermudah
                            pendataan
                            kepesertaan Anda.</p>
                    </div>
                    <div
                        class="bg-white/50 dark:bg-gray-800/30 backdrop-blur-xl p-4 md:p-6 rounded-3xl shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
                        <div v-if="pendingQuestions" class="space-y-6">
                            <USkeleton class="h-20 w-full rounded-2xl" v-for="i in 3" :key="i" />
                        </div>
                        <div v-else class="space-y-8 divide-y divide-gray-100/50 dark:divide-gray-800/50">
                            <div v-for="(question, index) in questions" :key="index" class="pt-6 first:pt-0">
                                <CoreQuestion :question="question.question" v-model="question.answer" />
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else-if="step?.id === 'select_payment'">
                    <div class="p-3 md:p-4">
                        <h3 class="text-lg font-semibold mb-4">{{ $ts('select_payment_method') }}</h3>

                        <div class="space-y-6">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                                <div v-for="option in paymentMethods" :key="option.value"
                                    class="relative rounded-2xl p-4 md:p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
                                    :class="formPayment.method === option.value ? 'bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-900 ring-2 ring-primary-500 shadow-md' : 'bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-primary-400'"
                                    @click="formPayment.method = option.value; formPayment.bank = 'bca'">
                                    <div class="flex flex-col items-center gap-3 text-center">
                                        <div :class="formPayment.method === option.value ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400' : 'bg-gray-50 dark:bg-gray-900 text-gray-500 group-hover:text-primary-500'"
                                            class="p-3 rounded-full transition-colors">
                                            <UIcon :name="option.icon" class="w-7 h-7" />
                                        </div>
                                        <span class="font-bold text-sm transition-colors"
                                            :class="formPayment.method === option.value ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'">{{
                                                option.label }}</span>
                                    </div>
                                    <div v-if="formPayment.method === option.value"
                                        class="absolute top-3 right-3 text-primary-500 animate-in zoom-in duration-300">
                                        <UIcon name="i-heroicons-check-circle-solid" class="w-5 h-5" />
                                    </div>
                                </div>
                            </div>

                            <div v-if="formPayment.method === 'bank_transfer'" class="animate-fade-in">
                                <UFormField label="Select Bank" help="Choose your preferred bank for Virtual Account">
                                    <URadioGroup v-model="formPayment.bank" :items="vaBanks"
                                        class="grid grid-cols-2 gap-2" :ui="{ fieldset: 'w-full' }" />
                                </UFormField>
                            </div>

                            <div v-if="formPayment.method !== 'cash'"
                                class="relative bg-white dark:bg-gray-900 rounded-2xl p-4 md:p-6 mt-8 border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden group hover:border-primary-200 dark:hover:border-primary-900/50 transition-colors">
                                <!-- Receipt Header Accent -->
                                <div
                                    class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-indigo-500">
                                </div>
                                <h4
                                    class="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2 uppercase tracking-widest text-xs">
                                    <UIcon name="i-heroicons-receipt-percent" class="w-5 h-5 text-primary-500" />
                                    Payment Summary
                                </h4>
                                <div class="space-y-4 font-mono text-sm">
                                    <div class="flex justify-between items-center">
                                        <span class="text-gray-500 dark:text-gray-400">Ticket Price</span>
                                        <span class="font-medium text-gray-900 dark:text-gray-100">Rp {{
                                            formatCurrency(priceSummary.base) }}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-gray-500 dark:text-gray-400">Admin Fee</span>
                                        <span class="font-medium text-gray-900 dark:text-gray-100">Rp {{
                                            formatCurrency(priceSummary.admin) }}</span>
                                    </div>
                                    <div
                                        class="pt-4 border-t-2 border-dashed border-gray-200 dark:border-gray-800 flex justify-between items-center">
                                        <span
                                            class="font-bold text-gray-900 dark:text-white text-base font-sans">Total</span>
                                        <span class="font-black text-2xl text-primary-600 dark:text-primary-400">Rp {{
                                            formatCurrency(priceSummary.total) }}</span>
                                    </div>
                                </div>
                            </div>

                            <div v-else class="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg">
                                <div class="flex gap-3">
                                    <UIcon name="i-heroicons-information-circle" class="w-6 h-6 text-yellow-500" />
                                    <div class="text-sm text-yellow-700 dark:text-yellow-200">
                                        Please come to the committee secretariat to make a cash payment.
                                        Amount: <strong>Rp {{ formatCurrency(agenda?.configuration.committee.amount ||
                                            0) }}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else-if="step?.id === 'payment'">
                    <div v-if="formPayment">
                        <PaymentDetail v-if="formPayment.method !== 'cash'"
                            :amount="agenda?.configuration.committee.amount" :payment="formPayment"
                            @cancel="onCancelPayment" @success="refreshCommittee" />
                        <div v-else>
                            <UAlert color="success" :title="$ts('cash_payment')"
                                :description="$ts('cash_payment_desc')" />
                        </div>
                    </div>
                    <div v-else class="text-center py-8">
                        <UIcon name="i-heroicons-arrow-path" class="animate-spin w-8 h-8 mx-auto text-gray-400" />
                        <p class="mt-2 text-gray-500">Loading payment details...</p>
                    </div>
                </div>

                <div v-else-if="step?.id === 'success'"
                    class="text-center py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div
                        class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 text-green-500 dark:text-green-400 mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)] animate-pulse">
                        <UIcon name="i-heroicons-check-circle-solid" class="w-16 h-16" />
                    </div>
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white mb-3">{{ $ts('registration_success') }}
                    </h2>
                    <p class="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6 text-sm">{{
                        $ts('registration_success_desc') }}</p>

                    <UAlert color="info" variant="soft" icon="i-heroicons-envelope"
                        class="max-w-md mx-auto mb-8 text-left ring-1 ring-blue-200 dark:ring-blue-800"
                        title="Cek Kotak Masuk Email Anda">
                        <template #description>
                            Kami telah mengirimkan instruksi dan tautan akses ke email Anda. Gunakan tautan tersebut
                            untuk melihat e-ticket, mengubah metode pembayaran, dan mendapatkan pemberitahuan lainnya di
                            kemudian hari.
                        </template>
                    </UAlert>

                    <div v-if="agenda?.configuration.messageAfterRegister"
                        class="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 rounded-3xl p-4 md:p-6 ring-1 ring-gray-100 dark:ring-gray-800 shadow-sm text-left max-w-2xl mx-auto backdrop-blur-xl">
                        <div class="flex items-center gap-2 mb-4 text-primary-500">
                            <UIcon name="i-heroicons-information-circle-solid" class="w-5 h-5" />
                            <span class="font-bold text-sm uppercase tracking-wider">Informasi Tambahan</span>
                        </div>
                        <CoreContent class="prose dark:prose-invert text-sm"
                            :content="agenda.configuration.messageAfterRegister" />
                    </div>
                </div>

            </template>
        </CoreStepper>
    </div>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-5px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>