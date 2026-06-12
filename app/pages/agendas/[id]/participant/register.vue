<script setup lang='ts'>
import type { IGuest, IMember, IParticipant, IPaymentMethod } from '~~/types';
import type { FieldValidationRules, FormError, Step } from '~~/types/component/stepper';
import type { IPaymentBody } from '~~/types/IRequestPost';
import type { IAgendaRegisterResponse, IAgendaResponse, IAnswersResponse, IParticipantResponse, IResponse } from '~~/types/IResponse';

definePageMeta({
    layout: 'client',
    auth: false
});
const route = useRoute();
const router = useRouter();
const toast = useToast();
const { id } = route.params as { id: string };
const tab = computed(() => route.query.tab as string | undefined);
const participantId = computed(() => route.query.participantId as string | undefined);

const { $api } = useNuxtApp()

const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);

const { data: user } = useAuth();
// Redirect logic removed to allow Guest registration and ticket viewing

const { data: agenda, refresh, pending: pendingAgenda } = useLazyAsyncData(`agenda-${id}`, async () => $api<IAgendaResponse>(`/api/agenda/${id}`, {
    method: 'GET',
}), {
    transform: (data) => data.data?.agenda,
});
const { data: participantData, refresh: refreshParticipant, pending: pendingParticipant } = useLazyAsyncData(`participantData-${id}`, () => {
    const currentParticipantId = participantId.value;
    if (!currentParticipantId) return Promise.resolve({ data: { participant: null } } as any);
    return $api<IParticipantResponse>(`/api/agenda/${id}/participant/me`, {
        method: 'GET',
        query: {
            participantId: currentParticipantId,
        }
    })
}, {
    transform: (data) => {
        return data.data?.participant;
    },
    watch: [participantId]
});

const participant = computed<IParticipant>(() => {
    if (participantData.value) {
        return participantData.value;
    }
    // Return a default structure for a new registration
    return {
        _id: '',
        agendaId: id,
        payment: undefined,
        member: user.value?.member,
        guest: user.value?.guest,
    } as IParticipant;
});
const registrationId = computed(() => participantId.value || participant.value?._id || '');

const { data: questions, refresh: refreshQuestions, pending: pendingQuestions } = useLazyAsyncData(`questions-${id}`, () => {
    const currentRegistrationId = registrationId.value;
    if (!currentRegistrationId) return Promise.resolve({ data: { answers: [], statusCode: 200, statusMessage: 'OK' } } as unknown as IAnswersResponse);
    return $api<IAnswersResponse>(`/api/agenda/${id}/participant/question/answer/${currentRegistrationId}`, {
        method: 'GET',
    })
}, {
    transform: (data) => {
        return data.data?.answers;
    },
    default: () => [],
    watch: [registrationId],
});

const { $ts } = useI18n();
const links = computed(() => [
    { label: $ts('home'), to: '/' },
    { label: $ts('agenda'), to: '/agendas' },
    { label: agenda.value?.title || '', to: `/agendas/${id}` },
    { label: $ts('register') }
]);
const steps = computed<Step[]>(() => {
    const steps: Step[] = [
        { id: 'registration', label: $ts('register'), title: $ts('register'), formData: formRegistration, validationRules: validationRuleRegistration, onNext: participant.value._id ? nextToAnswerQuestion : register },
        { id: 'answer_question', label: $ts('answer_question'), title: $ts('answer_question'), formData: {}, validationRules: {}, onNext: handleAnswer },
        { id: 'select_payment', label: $ts('select_payment'), title: $ts('select_payment'), formData: formSelectPayment, validationRules: validationRuleSelectPayment, onNext: formSelectPayment.method !== 'cash' ? payment : undefined },
        { id: 'payment', label: $ts('payment'), title: $ts('payment'), formData: formPayment, validationRules: validationRuleConfirmation },
        { id: 'success', label: $ts('success'), title: $ts('success'), formData: {} }
    ];
    return steps.filter(step => {
        if (step.id === 'answer_question') {
            return agenda.value?.configuration?.participant?.questions && agenda.value?.configuration?.participant?.questions.length > 0;
        }
        if (step.id === 'select_payment') {
            return agenda.value?.configuration?.participant?.pay || agenda.value?.configuration?.committee?.pay;
        }
        if (step.id === 'payment') {
            return agenda.value?.configuration?.participant?.pay || agenda.value?.configuration?.committee?.pay;
        }
        return true;
    });
});
const activeStep = ref(0);

const registerAs = ref((participant.value?.guest as IGuest | undefined) ? ((participant.value?.guest as IGuest | undefined)?.instance ? 'non-student' : 'student-guest') : (user.value ? 'student' : 'non-student'));
const draftRegistration = useLocalStorage(`draft_registration_${id}`, {
    registerAs: registerAs.value,
    fullName: '',
    email: '',
    phone: '',
    NIM: 0,
    class: '',
    semester: 0,
    prodi: '',
    instance: ''
});

const formRegistration = reactive({
    registerAs: draftRegistration.value.registerAs || registerAs.value,
    fullName: draftRegistration.value.fullName || '',
    email: draftRegistration.value.email || '',
    phone: draftRegistration.value.phone || '',
    NIM: draftRegistration.value.NIM || 0,
    class: draftRegistration.value.class || '',
    semester: draftRegistration.value.semester || 0,
    prodi: draftRegistration.value.prodi || '',
    instance: draftRegistration.value.instance || '',
});

watch(participantData, (p) => {
    if (p && !draftRegistration.value.fullName) {
        formRegistration.fullName = (p.member as IMember)?.fullName || (p.guest as IGuest | undefined)?.fullName || '';
        formRegistration.email = (p.member as IMember)?.email || (p.guest as IGuest | undefined)?.email || '';
        formRegistration.phone = (p.member as IMember)?.phone || (p.guest as IGuest | undefined)?.phone || '';
        formRegistration.NIM = (p.member as IMember)?.NIM || (p.guest as IGuest | undefined)?.NIM || 0;
        formRegistration.class = (p.member as IMember)?.class || (p.guest as IGuest | undefined)?.class || '';
        formRegistration.semester = (p.member as IMember)?.semester || (p.guest as IGuest | undefined)?.semester || 0;
        formRegistration.prodi = (p.guest as IGuest | undefined)?.prodi || '';
        formRegistration.instance = (p.guest as IGuest | undefined)?.instance || '';
    }
}, { immediate: true });

watch(formRegistration, (val) => {
    draftRegistration.value = { ...val };
}, { deep: true });
const formSelectPayment = reactiveComputed(() => ({
    method: participant.value?.payment?.method || 'bank_transfer',
    status: participant.value?.payment?.status || 'pending',
    order_id: participant.value?.payment?.order_id || '',
    transaction_id: participant.value?.payment?.transaction_id || '',
    bank: participant.value?.payment?.bank || 'bca',
    va_number: participant.value?.payment?.va_number || '',
    time: participant.value?.payment?.time || new Date(),
    expiry: participant.value?.payment?.expiry || new Date(),
    qris_png: participant.value?.payment?.qris_png || '',
}));
const formPayment = reactiveComputed(() => ({
    status: formSelectPayment.status || 'pending',
}));
const checkIfProdiIsInformatics = computed(() => {
    const prodi = formRegistration.prodi?.toLowerCase().replace(/\s+/g, '') ?? '';
    return ['informatics', 'informatika', 'computerscience', 'cs', 'it', 'informationtechnology'].includes(prodi);
});
const registerAsOptions = computed(() => {
    const options = [
        { label: $ts('non_student'), value: 'non-student' },
        { label: $ts('student_guest'), value: 'student-guest' },
    ];
    if (user.value) {
        options.unshift({ label: $ts('student'), value: 'student' });
    }
    return options;
});
const paymentMethods = ref<{ label: string; value: IPaymentMethod; icon: string; }[]>([
    { label: $ts('cash'), value: 'cash', icon: 'i-heroicons-banknotes' },
    { label: $ts('transfer'), value: 'bank_transfer', icon: 'i-heroicons-credit-card' },
    { label: $ts('qris'), value: 'qris', icon: 'i-heroicons-qr-code' }
]);
const vaBanks = ref([
    { label: 'BCA', value: 'bca' },
    { label: 'BNI', value: 'bni' },
    { label: 'BRI', value: 'bri' },
    { label: 'Mandiri', value: 'mandiri' },
]);
// --- ADMIN FEE CALCULATION ---
const FEES = {
    VA: 4000,
    QRIS: 0.007,
    Cash: 0
};

const priceSummary = computed(() => {
    const basePrice = agenda.value?.configuration?.participant?.amount || 0;
    let adminFee = 0;

    if (formSelectPayment.method === 'bank_transfer') {
        adminFee = FEES.VA;
    } else if (formSelectPayment.method === 'qris') {
        adminFee = Math.ceil(basePrice * FEES.QRIS);
    } else if (formSelectPayment.method === 'cash') {
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

/** 
 * method to validate form data
 */

const nextToAnswerQuestion = async () => {
    refreshParticipant();
    refreshQuestions();
}

const register = async (): Promise<boolean | FormError> => {
    try {
        const body: any = {};
        // Logic is simplified: if no user is logged in, it's a guest registration.
        if (!user.value) {
            body.guest = formRegistration;
        }

        const { data, statusCode, statusMessage } = await $api<IAgendaRegisterResponse>(`/api/agenda/${id}/participant/register`, {
            method: 'POST',
            body
        });
        if (statusCode === 200 && data) {
            if (!user.value && (data as any).participantId) {
                const pCookie = useCookie(`agenda-participant-${id}`, { maxAge: 60 * 60 * 24 * 30 });
                pCookie.value = (data as any).participantId;
                router.replace({ query: { ...route.query, participantId: (data as any).participantId, tab: agenda.value?.configuration?.participant?.questions && agenda.value?.configuration?.participant?.questions.length > 0 ? 'answer_question' : 'select_payment' } });
            }
            refreshParticipant();
            return true;
        } else {
            toast.add({
                title: $ts('failed'),
                description: statusMessage || $ts('failed_to_register'),
                color: 'error',
            })
            return false;
        }
    } catch (error) {
        toast.add({
            title: $ts('failed'),
            description: $ts('failed_to_register'),
            color: 'error',
        })
        return false;
    }
}
const payment = async (): Promise<boolean | FormError> => {
    const RegistrationId = participant.value._id || registrationId.value || '';
    if (!RegistrationId) {
        toast.add({
            title: $ts('failed'),
            description: $ts('failed_to_register_payment'),
            color: 'error',
        })
        return false;
    }
    try {
        const { data, statusCode } = await $api<IAgendaRegisterResponse>(`/api/agenda/${id}/participant/register/${RegistrationId}/payment`, {
            method: 'POST',
            body: {
                payment_method: formSelectPayment.method,
                bank_transfer: formSelectPayment.bank,
            } as IPaymentBody
        });
        if (statusCode === 200 && data) {
            router.replace({ query: { ...route.query, tab: 'payment' } })
            refreshParticipant();
            return true;
        } else {
            toast.add({
                title: $ts('failed'),
                description: $ts('failed_to_register_payment'),
                color: 'error',
            })
            return false;
        }
    } catch (error) {
        toast.add({
            title: $ts('failed'),
            description: $ts('failed_to_register_payment'),
            color: 'error',
        })
        return false;
    }
}
const onCancelPayment = async () => {
    refreshParticipant();
    activeStep.value = 1;
}


/**
 * Responsive classes for UI elements
 */
const responsiveClasses = computed(() => ({
    label: isMobile.value ? 'text-xs' : 'text-base',
    input: isMobile.value ? 'text-xs' : 'text-base',
    gridCols: 'grid-cols-1 md:grid-cols-2',
    container: isMobile.value ? 'p-2' : 'p-3',
}));

const validationRuleRegistration: FieldValidationRules = reactiveComputed(() => {
    const rules: FieldValidationRules = {
        registerAs: (value: string) => value ? null : { message: $ts('register_as_required'), path: 'registerAs' },
        fullName: (value: string) => value ? null : { message: $ts('name_required'), path: 'fullName' },
        email: (value: string) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return value && emailRegex.test(value) ? null : { message: $ts('valid_email'), path: 'email' };
        },
        phone: (value: string) => {
            const phoneRegex = /^\d{10,15}$/;
            return value && phoneRegex.test(value.replace(/\D/g, '')) ? null : { message: $ts('valid_phone'), path: 'phone' };
        },
    };

    // No longer check for user.value here, rely on registerAs
    if (formRegistration.registerAs === 'student' || formRegistration.registerAs === 'student-guest') {
        rules.NIM = (value: number) => value > 0 ? null : { message: $ts('NIM_required'), path: 'NIM' };
        rules.class = (value: string) => value ? null : { message: $ts('class_required'), path: 'class' };
        rules.semester = (value: number) => value > 0 ? null : { message: $ts('semester_required'), path: 'semester' };
        rules.prodi = (value: string) => value ? null : { message: $ts('prodi_required'), path: 'prodi' };
    }

    if (formRegistration.registerAs === 'student-guest' || formRegistration.registerAs === 'non-student') {
        rules.instance = (value: string) => value ? null : { message: $ts('instance_required'), path: 'instance' };
    }

    // If user is logged in, some fields are not required to be re-validated as they are pre-filled and disabled.
    if (user.value) {
        delete rules.fullName;
        delete rules.email;
        delete rules.phone;
        if (formRegistration.registerAs === 'student') {
            delete rules.NIM;
            delete rules.class;
            delete rules.semester;
        }
    }

    return rules;
});
const validationRuleSelectPayment: FieldValidationRules = reactiveComputed(() => ({
    method: (value: string) => value ? null : { message: $ts('payment_method_required'), path: 'method' },
    bank: (value: string) => {
        if (formSelectPayment.method !== 'bank_transfer') return null;
        return value ? null : { message: $ts('bank_required'), path: 'bank' };
    },
}));
const validationRuleConfirmation: FieldValidationRules = reactiveComputed(() => ({
    status: (value: string) => formSelectPayment.method !== 'cash' ? (value ? null : { message: $ts('confirmation_required'), path: 'status' }) : null,
}));
const onCompleted = async () => {
    draftRegistration.value = {
        registerAs: '', fullName: '', email: '', phone: '', NIM: 0, class: '', semester: 0, prodi: '', instance: ''
    }; // clear draft
    router.push(`/agendas/${id}/participant?participantId=${registrationId.value}`);
}
async function handleAnswer() {
    try {
        const formData = new FormData();
        const answersPayload = questions.value?.map((q) => {
            if (q.question.type === 'file' && (q.answer as any) instanceof File) {
                formData.append(q.question._id as string, q.answer);
                return { questionId: q.question._id, answer: '[[FILE]]' };
            }
            return { questionId: q.question._id, answer: q.answer };
        });

        formData.append('answers', JSON.stringify(answersPayload));
        const response = await $api<IResponse & { data: string }>(`/api/agenda/${id}/participant/question/answer/${registrationId.value}`, {
            method: 'POST',
            body: formData,
        });
        if (response.statusCode !== 200) {
            toast.add({ title: $ts('failed'), description: $ts('failed_to_answer_question'), color: 'error' });
            return false;
        }
        toast.add({ title: $ts('success'), description: $ts('success_to_answer_question'), color: 'success' });
        return true;
    } catch (error) {
        toast.add({ title: $ts('success'), description: $ts('failed_to_answer_question'), color: 'error' });
        return false;
    }
}
const isInitialized = ref(false);

const syncTabToStep = (tabValue: string | undefined) => {
    if (!tabValue || typeof tabValue !== 'string') return;
    const stepMap: Record<string, number> = {
        'register': 0,
        'answer_question': steps.value.findIndex(s => s.id === 'answer_question'),
        'select_payment': steps.value.findIndex(s => s.id === 'select_payment'),
        'payment': steps.value.findIndex(s => s.id === 'payment'),
        'success': steps.value.findIndex(s => s.id === 'success'),
    };
    const targetStep = stepMap[tabValue];
    if (targetStep !== undefined && targetStep >= 0 && activeStep.value !== targetStep) {
        activeStep.value = targetStep;
    }
};

onMounted(() => {
    watchEffect(() => {
        if (pendingAgenda.value || pendingParticipant.value || isInitialized.value) return;
        isInitialized.value = true;
        syncTabToStep(tab.value);
    });
});

watch(tab, (newTab) => {
    syncTabToStep(newTab);
});

watch(activeStep, (newIndex) => {
    const step = steps.value[newIndex];
    if (step && step.id !== tab.value) {
        router.replace({ query: { ...route.query, tab: step.id } });
    }
});
watch(participant, (newValue) => {
    // Hanya tampilkan error jika data participant sudah selesai diload namun tidak ada id
    if (!pendingParticipant.value && participantId.value && !newValue?._id) {
        toast.add({
            title: $ts('failed'),
            description: $ts('participant_not_found'),
            color: 'error',
        })
    }
})
</script>
<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :items="links" />
        <div v-if="pendingAgenda || pendingParticipant" class="mt-4">
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
                    <UAlert v-if="participant._id" color="success" :title="$ts('already_participant')"
                        :description="$ts('already_participant_desc')" class="mb-4"></UAlert>
                    <div class="flex space-x-4">
                        <UFormField :label="$ts('register_as')" class="px-4" :error="errors.registerAs?.message">
                            <URadioGroup v-model="registerAs" :items="registerAsOptions"
                                :disabled="user ? true : false" />
                        </UFormField>
                    </div>
                    <UAlert v-if="!user" color="info" variant="soft" class="mt-4 mx-4 shadow-sm"
                        icon="i-heroicons-information-circle" title="Pendaftaran Mudah Tanpa Password">
                        <template #description>
                            Akses E-Ticket Anda dijamin aman melalui <b>Sistem Magic Link</b>. Mohon pastikan email yang
                            Anda gunakan aktif untuk menerima tautan tiket acara Anda secara langsung.
                        </template>
                    </UAlert>
                    <USeparator class="my-6" />
                    <div class="text-start">
                        <div class="space-y-6" v-if="registerAs">
                            <div :class="['grid gap-4 px-4', responsiveClasses.gridCols]">
                                <UFormField :label="$ts('NIM')" v-if="registerAs !== 'non-student'"
                                    :error="errors.NIM?.message" help="Nomor Induk Mahasiswa Anda">
                                    <UInput v-model="formRegistration.NIM" size="lg" :disabled="user ? true : false"
                                        class="focus:ring-2 focus:ring-primary-500" />
                                </UFormField>
                                <UFormField :label="$ts('name')" :error="errors.fullName?.message"
                                    help="Nama lengkap sesuai identitas">
                                    <UInput v-model="formRegistration.fullName" size="lg"
                                        :disabled="user ? true : false" class="focus:ring-2 focus:ring-primary-500" />
                                </UFormField>
                                <UFormField :label="$ts('email')" :error="errors.email?.message"
                                    help="Email aktif untuk pengiriman E-Ticket">
                                    <UInput v-model="formRegistration.email" size="lg" :disabled="user ? true : false"
                                        class="focus:ring-2 focus:ring-primary-500" />
                                </UFormField>
                                <UFormField :label="$ts('phone')" :error="errors.phone?.message"
                                    help="Nomor WhatsApp yang bisa dihubungi">
                                    <UInput v-model="formRegistration.phone" size="lg" :disabled="user ? true : false"
                                        class="focus:ring-2 focus:ring-primary-500" />
                                </UFormField>
                                <UFormField :label="$ts('class')" v-if="registerAs !== 'non-student'"
                                    :error="errors.class?.message" help="Contoh: A, B, atau Reguler">
                                    <UInput v-model="formRegistration.class" size="lg" :disabled="user ? true : false"
                                        class="focus:ring-2 focus:ring-primary-500" />
                                </UFormField>
                                <UFormField :label="$ts('semester')" v-if="registerAs !== 'non-student'"
                                    :error="errors.semester?.message" help="Semester saat ini">
                                    <UInput v-model="formRegistration.semester" size="lg"
                                        :disabled="user ? true : false" class="focus:ring-2 focus:ring-primary-500" />
                                </UFormField>
                                <UFormField :label="$ts('prodi')" v-if="registerAs !== 'non-student' && !user"
                                    :error="errors.prodi?.message" help="Program Studi Anda">
                                    <UInput v-model="formRegistration.prodi" size="lg" :disabled="user ? true : false"
                                        class="focus:ring-2 focus:ring-primary-500" />
                                </UFormField>
                                <UFormField :label="$ts('instance')"
                                    v-if="registerAs === 'non-student' || registerAs === 'student-guest'"
                                    :error="errors.instance?.message" help="Asal Universitas / Instansi / Perusahaan">
                                    <UInput v-model="formRegistration.instance" size="lg"
                                        :disabled="user ? true : false" class="focus:ring-2 focus:ring-primary-500" />
                                </UFormField>
                                <p v-if="checkIfProdiIsInformatics"
                                    class="md:col-span-2 text-red-500 dark:text-red-400">**
                                    {{
                                        $ts('is_informatics_message') }} <ULink to="/register"
                                        class="text-blue-500 underline">{{
                                            $ts('here')
                                        }}</ULink>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else-if="step?.id === 'answer_question'">
                    <div v-if="pendingQuestions" class="space-y-4">
                        <USkeleton class="h-16 w-full" v-for="i in 3" :key="i" />
                    </div>
                    <div v-else class="space-y-4">
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
                                    :class="formSelectPayment.method === option.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 ring-2 ring-primary-500' : 'border-gray-200 dark:border-gray-700'"
                                    @click="formSelectPayment.method = option.value; formSelectPayment.bank = option.value === 'e_wallet' ? 'gopay' : 'bca'">
                                    <div class="flex items-center gap-3">
                                        <UIcon :name="option.icon" class="w-6 h-6 text-primary-500" />
                                        <span class="font-medium">{{ option.label }}</span>
                                    </div>
                                </div>
                            </div>

                            <div v-if="formSelectPayment.method === 'bank_transfer'" class="animate-fade-in">
                                <UFormField label="Select Bank" help="Choose your preferred bank for Virtual Account">
                                    <URadioGroup v-model="formSelectPayment.bank" :items="vaBanks"
                                        class="grid grid-cols-2 gap-2" :ui="{ fieldset: 'w-full' }" />
                                </UFormField>
                            </div>

                            <div v-if="formSelectPayment.method !== 'cash'"
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
                                    <USeparator class="my-2" />
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
                                        Amount: <strong>Rp {{ formatCurrency(agenda?.configuration.participant.amount ||
                                            0) }}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else-if="step?.id === 'payment'">
                    <PaymentDetail :amount="agenda?.configuration.participant.amount" :payment="formSelectPayment"
                        @cancel="onCancelPayment" />
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
<style scoped></style>