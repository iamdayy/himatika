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
const { data: agendaData } = useAsyncData(() => $api<IAgendaResponse>(`/api/agenda/${id}`, {
    method: 'GET',
}));

const { data: committeeData, refresh: refreshCommittee } = useAsyncData(() => $api<ICommitteeResponse>(`/api/agenda/${id}/committee/me`, {
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
const { data: questions } = useAsyncData(() => $api<IAnswersResponse>(`/api/agenda/${id}/committee/question/answer/${registrationId.value}`, {
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
        disabled: agenda.value?.committees ? agenda.value?.committees.filter(c => c.job === item.label && c.approved).length >= item.count : false,
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
            refreshCommittee();
            return true;
        }
        return false;
    } catch (error) {
        console.error(error);
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
        return false;
    } catch (error) {
        console.error(error);
        toast.add({ title: $ts('error'), description: 'Failed to create payment', color: 'error' });
        return false;
    }
}

const onCancelPayment = async () => {
    refreshCommittee();
    activeStep.value = steps.value.findIndex(s => s.id === 'select_payment');
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
        <CoreStepper :steps="steps" v-model="activeStep" validate-on-change @complete="onCompleted"
            :prev-button-text="$ts('previous')" :next-button-text="$ts('next')" :complete-button-text="$ts('complete')">

            <template #default="{ step, errors }">

                <div v-if="step?.id === 'registration'">
                    <UAlert v-if="committee?._id" color="success" :title="$ts('already_committee')"
                        :description="$ts('already_committee_desc')" class="mb-4"></UAlert>
                    <Useparator class="my-4" />
                    <div class="text-start">
                        <div class="space-y-4">
                            <div :class="['grid gap-2 px-4', isMobile ? 'grid-cols-1' : 'grid-cols-6']">
                                <UFormField class="col-span-full" :label="$ts('job')" :error="errors.job?.message">
                                    <URadioGroup v-model="formRegistration.job" :items="jobAvailablesItems" />
                                </UFormField>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else-if="step?.id === 'answer_question'">
                    <div class="space-y-4">
                        <CoreQuestion v-for="(question, index) in questions" :key="index" :question="question.question"
                            v-model="question.answer" />
                    </div>
                </div>

                <div v-else-if="step?.id === 'select_payment'">
                    <div class="p-3 md:p-4">
                        <h3 class="text-lg font-semibold mb-4">{{ $ts('select_payment_method') }}</h3>

                        <div class="space-y-6">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div v-for="option in paymentMethods" :key="option.value"
                                    class="border rounded-lg p-4 cursor-pointer transition-all hover:border-primary-500"
                                    :class="formPayment.method === option.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 ring-2 ring-primary-500' : 'border-gray-200 dark:border-gray-700'"
                                    @click="formPayment.method = option.value; formPayment.bank = option.value === 'e_wallet' ? 'gopay' : 'bca'">
                                    <div class="flex items-center gap-3">
                                        <UIcon :name="option.icon" class="w-6 h-6 text-primary-500" />
                                        <span class="font-medium">{{ option.label }}</span>
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
                                class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-6">
                                <h4 class="font-semibold text-gray-700 dark:text-gray-200 mb-3">Payment Summary</h4>
                                <div class="space-y-2 text-sm">
                                    <div class="flex justify-between">
                                        <span class="text-gray-500">Ticket Price</span>
                                        <span>Rp {{ formatCurrency(priceSummary.base) }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-500">Admin Fee</span>
                                        <span>Rp {{ formatCurrency(priceSummary.admin) }}</span>
                                    </div>
                                    <Useparator class="my-2" />
                                    <div class="flex justify-between font-bold text-lg text-primary-600">
                                        <span>Total</span>
                                        <span>Rp {{ formatCurrency(priceSummary.total) }}</span>
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

                <div v-else-if="step?.id === 'success'">
                    <UAlert color="success" :title="$ts('registration_success')"
                        :description="$ts('registration_success_desc')" />
                    <CoreContent class="my-4" :content="agenda?.configuration.messageAfterRegister || ''" />
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