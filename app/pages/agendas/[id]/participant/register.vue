<script setup lang='ts'>
import { ModalsAuthLoginRequired } from '#components';
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
const overlay = useOverlay();
const LoginRequiredModal = overlay.create(ModalsAuthLoginRequired);

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
    { label: $ts('participant') },
    { label: $ts('register') }
]);
const steps = computed<Step[]>(() => {
    const steps: Step[] = [
        { id: 'cover', label: 'Panduan', title: 'Panduan Pendaftaran', formData: formCover, validationRules: validationRuleCover },
        { id: 'select_ticket', label: 'Tiket', title: 'Pilih Tiket', formData: formSelectTicket, validationRules: validationRuleSelectTicket },
        { id: 'register_as', label: 'Peran', title: 'Daftar Sebagai', formData: formRegisterAs, validationRules: validationRuleRegisterAs },
        { id: 'data_diri', label: 'Data Diri', title: 'Data Diri', formData: formRegistration, validationRules: validationRuleRegistration, onNext: participant.value._id ? nextToAnswerQuestion : register },
        { id: 'answer_question', label: 'Tambahan', title: 'Pertanyaan', formData: {}, validationRules: {}, onNext: handleAnswer },
        { id: 'select_payment', label: 'Pembayaran', title: 'Metode Pembayaran', formData: formSelectPayment, validationRules: validationRuleSelectPayment, onNext: formSelectPayment.method !== 'cash' ? payment : undefined },
        { id: 'payment', label: 'Instruksi', title: 'Instruksi Pembayaran', formData: formPayment, validationRules: validationRuleConfirmation },
        { id: 'success', label: 'Selesai', title: 'Pendaftaran Selesai', formData: {} }
    ];
    return steps.filter(step => {
        if (step.id === 'select_ticket') {
            return hasTicketModels.value;
        }
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

const registerAs = ref((participant.value?.guest as IGuest | undefined) ? ((participant.value?.guest as IGuest | undefined)?.instance === 'ITSNU Pekalongan' ? 'internal-student' : 'external-student') : (user.value ? 'himatika-member' : 'public'));
const formCover = reactive({ agreed: false });
const selectedTicketModelId = ref<string | undefined>(undefined);
const formSelectTicket = reactiveComputed(() => ({ ticketModelId: selectedTicketModelId.value }));
const formRegisterAs = reactiveComputed(() => ({ role: registerAs.value }));
const ticketModels = computed(() => agenda.value?.configuration?.participant?.ticketModels || []);
const hasTicketModels = computed(() => ticketModels.value.length > 0);
const selectedTicketModel = computed(() => {
    if (!selectedTicketModelId.value) return null;
    return ticketModels.value.find((m: any) => (m._id || m.name) === selectedTicketModelId.value) || null;
});
const draftRegistration = useLocalStorage(`draft_registration_${id}`, {
    registerAs: registerAs.value,
    fullName: '',
    email: '',
    phone: '',
    NIM: 0,
    class: '',
    semester: 0,
    prodi: '',
    instance: '',
    confirmEmail: ''
});

const initialFormData = computed(() => {
    if (user.value?.member) {
        return {
            registerAs: 'himatika-member',
            fullName: user.value.member.fullName || '',
            email: user.value.member.email || '',
            phone: user.value.member.phone || '',
            NIM: user.value.member.NIM || 0,
            class: user.value.member.class || '',
            semester: user.value.member.semester || 0,
            prodi: (user.value.member as any).prodi || '',
            instance: '',
            confirmEmail: user.value.member.email || ''
        };
    } else if (user.value?.guest) {
        return {
            registerAs: user.value.guest.instance === 'ITSNU Pekalongan' ? 'internal-student' : 'external-student',
            fullName: user.value.guest.fullName || '',
            email: user.value.guest.email || '',
            phone: user.value.guest.phone || '',
            NIM: user.value.guest.NIM || 0,
            class: user.value.guest.class || '',
            semester: user.value.guest.semester || 0,
            prodi: user.value.guest.prodi || '',
            instance: user.value.guest.instance || '',
            confirmEmail: user.value.guest.email || ''
        };
    }
    return draftRegistration.value;
});

const isFieldDisabled = (field: string) => {
    if (field === 'instance' && registerAs.value === 'internal-student') return true;
    if (!user.value) return false;
    if (user.value.member) return !!(user.value.member as any)[field];
    if (user.value.guest) return !!(user.value.guest as any)[field];
    return false;
};

const formRegistration = reactive({
    registerAs: initialFormData.value.registerAs || registerAs.value,
    fullName: initialFormData.value.fullName || '',
    email: initialFormData.value.email || '',
    phone: initialFormData.value.phone || '',
    NIM: initialFormData.value.NIM || 0,
    class: initialFormData.value.class || '',
    semester: initialFormData.value.semester || 0,
    prodi: initialFormData.value.prodi || '',
    instance: initialFormData.value.instance || '',
    confirmEmail: initialFormData.value.confirmEmail || '',
});

watchDebounced(formRegistration, (newVal) => {
    if (!user.value) {
        draftRegistration.value = { ...newVal };
    }
}, { deep: true, debounce: 500, maxWait: 2000 });

watch(initialFormData, (newVal) => {
    if (user.value) {
        Object.assign(formRegistration, newVal);
    }
}, { deep: true, immediate: true });

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
        formRegistration.confirmEmail = (p.member as IMember)?.email || (p.guest as IGuest | undefined)?.email || '';
    }
}, { immediate: true });

// Duplicate watcher for draftRegistration removed
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
    manual_target: participant.value?.payment?.manual_target || '',
}));
const formPayment = reactiveComputed(() => ({
    status: formSelectPayment.status || 'pending',
}));
const checkIfProdiIsInformatics = computed(() => {
    const prodi = formRegistration.prodi?.toLowerCase().replace(/\s+/g, '') ?? '';
    return ['informatics', 'informatika', 'computerscience', 'cs', 'it', 'informationtechnology'].includes(prodi);
});
const registerAsOptions = computed(() => {
    let options = [
        { label: 'Mahasiswa Internal', description: 'Mahasiswa ITSNU Pekalongan', value: 'internal-student', icon: 'i-heroicons-academic-cap' },
        { label: 'Mahasiswa Eksternal', description: 'Mahasiswa dari institusi lain', value: 'external-student', icon: 'i-heroicons-building-library' },
        { label: 'Umum', description: 'Masyarakat umum / Non-Mahasiswa', value: 'public', icon: 'i-heroicons-user-group' },
    ];
    if (user.value) {
        options.unshift({ label: 'Anggota Himatika', description: 'Anggota Himatika ITSNU Pekalongan', value: 'himatika-member', icon: 'i-heroicons-identification' });
    }
    const canReg = agenda.value?.configuration?.participant?.canRegister;
    if (canReg === 'Member' || canReg === 'Organizer') {
        options = options.filter(o => o.value === 'himatika-member');
    }
    return options;
});

watch(registerAs, (newVal) => {
    if (newVal === 'internal-student') {
        formRegistration.instance = 'ITSNU Pekalongan';
    } else if (newVal === 'himatika-member' && user.value?.member) {
        formRegistration.instance = 'ITSNU Pekalongan';
        formRegistration.prodi = 'Teknik Informatika';
    } else if (!user.value) {
        formRegistration.instance = draftRegistration.value.instance || '';
    }
}, { immediate: true });
const paymentMethods = computed<{ label: string; value: IPaymentMethod; icon: string; }[]>(() => {
    const methods = [
        { label: $ts('cash'), value: 'cash', icon: 'i-heroicons-banknotes' },
        { label: $ts('transfer'), value: 'bank_transfer', icon: 'i-heroicons-credit-card' },
        { label: $ts('qris'), value: 'qris', icon: 'i-heroicons-qr-code' }
    ] as { label: string; value: IPaymentMethod; icon: string; }[];
    if (agenda.value?.configuration?.manualPayments && agenda.value.configuration.manualPayments.length > 0) {
        methods.push({ label: 'Transfer Manual', value: 'manual_transfer', icon: 'i-heroicons-document-text' });
    }
    return methods;
});
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
    // Gunakan harga dari ticketModel jika ada, fallback ke harga default
    const basePrice = selectedTicketModel.value?.price ?? agenda.value?.configuration?.participant?.amount ?? 0;
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
        } else {
            body.memberUpdate = formRegistration;
        }
        // Attach selected ticket model
        if (selectedTicketModelId.value) {
            body.ticketModelId = selectedTicketModelId.value;
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
            toast.add({
                title: $ts('success'),
                description: 'Tautan akses tiket dan status pembayaran telah dikirim ke email Anda.',
                color: 'success',
            });
            refreshParticipant();
            return true;
        } else if (statusCode === 409) {
            toast.add({
                title: $ts('failed'),
                description: statusMessage || $ts('failed_to_register'),
                color: 'error',
            });
            router.replace({
                query: {
                    ...route.query,
                    participantId: (data as any).participantId,
                    tab: steps.value?.[1]?.id
                }
            });
            return true;
        } else {
            toast.add({
                title: $ts('failed'),
                description: statusMessage || $ts('failed_to_register'),
                color: 'error',
            })
            return false;
        }
    } catch (error: any) {
        const errorMsg = error?.data?.statusMessage || error?.data?.message || error?.statusMessage || error?.message || $ts('failed_to_register');

        // Intercept specific error when a guest uses a Member's email
        if (error?.data?.statusCode === 403 && errorMsg.includes('Mahasiswa (Member)')) {
            LoginRequiredModal.open({
                email: formRegistration.email,
                callbackUrl: `/agendas/${id}/participant/register`
            });
            return false;
        }

        if (error?.data?.statusCode === 409) {
            router.replace({
                query: {
                    ...route.query,
                    participantId: (error?.data as any).participantId,
                    tab: steps.value?.[1]?.id
                }
            });
            return true;
        }

        toast.add({
            title: $ts('failed'),
            description: errorMsg,
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
        const { data, statusCode, statusMessage } = await $api<IAgendaRegisterResponse>(`/api/agenda/${id}/participant/register/${RegistrationId}/payment`, {
            method: 'POST',
            body: {
                payment_method: formSelectPayment.method,
                bank_transfer: formSelectPayment.bank,
                manual_target: formSelectPayment.manual_target,
            } as IPaymentBody
        });
        if (statusCode === 200 && data) {
            router.replace({ query: { ...route.query, tab: 'payment' } })
            refreshParticipant();
            return true;
        } else {
            toast.add({
                title: $ts('failed'),
                description: statusMessage || $ts('failed_to_register_payment'),
                color: 'error',
            })
            return false;
        }
    } catch (error: any) {
        toast.add({
            title: $ts('failed'),
            description: error?.data?.statusMessage || error?.data?.message || error?.statusMessage || error?.message || $ts('failed_to_register_payment'),
            color: 'error',
        })
        return false;
    }
}
const onCancelPayment = async () => {
    refreshParticipant();
    const stepIndex = steps.value.findIndex(s => s.id === 'select_payment');
    if (stepIndex !== -1) {
        activeStep.value = stepIndex;
    } else {
        activeStep.value = 1;
    }
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

const validationRuleCover = { agreed: (val: boolean) => val ? null : { message: 'Anda harus menyetujui Syarat & Ketentuan', path: 'agreed' } };
const validationRuleSelectTicket = { ticketModelId: (val: string) => val ? null : { message: 'Silakan pilih tiket yang tersedia', path: 'ticketModelId' } };
const validationRuleRegisterAs = { role: (val: string) => val ? null : { message: 'Silakan pilih peran pendaftaran Anda', path: 'role' } };

const validationRuleRegistration: FieldValidationRules = reactiveComputed(() => {
    const rules: FieldValidationRules = {
        fullName: (value: string) => value ? null : { message: $ts('name_required'), path: 'fullName' },
        email: (value: string) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return value && emailRegex.test(value) ? null : { message: $ts('valid_email'), path: 'email' };
        },
        confirmEmail: (value: string) => {
            if (user.value) return null;
            if (!value) return { message: 'Konfirmasi email wajib diisi', path: 'confirmEmail' };
            if (value !== formRegistration.email) return { message: 'Email tidak cocok', path: 'confirmEmail' };
            return null;
        },
        phone: (value: string) => {
            const phoneRegex = /^\d{10,15}$/;
            return value && phoneRegex.test(value.replace(/\D/g, '')) ? null : { message: $ts('valid_phone'), path: 'phone' };
        },
    };

    if (formRegistration.registerAs === 'himatika-member' || formRegistration.registerAs === 'internal-student' || formRegistration.registerAs === 'external-student') {
        rules.NIM = (value: number) => value > 0 ? null : { message: $ts('NIM_required'), path: 'NIM' };
        rules.semester = (value: number) => value > 0 ? null : { message: $ts('semester_required'), path: 'semester' };
        rules.prodi = (value: string) => value ? null : { message: $ts('prodi_required'), path: 'prodi' };
        if (formRegistration.registerAs === 'himatika-member') {
            rules.class = (value: string) => value ? null : { message: $ts('class_required'), path: 'class' };
        }
    }

    if (formRegistration.registerAs !== 'himatika-member') {
        rules.instance = (value: string) => value ? null : { message: $ts('instance_required'), path: 'instance' };
    }

    // If user is logged in, some fields are not required to be re-validated as they are pre-filled and disabled.
    if (user.value) {
        delete rules.fullName;
        delete rules.email;
        delete rules.phone;
        if (formRegistration.registerAs === 'himatika-member') {
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
    manual_target: (value: string) => {
        if (formSelectPayment.method !== 'manual_transfer') return null;
        return value ? null : { message: 'Pilih rekening tujuan', path: 'manual_target' };
    },
}));
const validationRuleConfirmation: FieldValidationRules = reactiveComputed(() => ({
    status: (value: string) => formSelectPayment.method !== 'cash' ? (value ? null : { message: $ts('confirmation_required'), path: 'status' }) : null,
}));
const onCompleted = async () => {
    draftRegistration.value = {
        registerAs: '', fullName: '', email: '', confirmEmail: '', phone: '', NIM: 0, class: '', semester: 0, prodi: '', instance: ''
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
            toast.add({ title: $ts('failed'), description: response.statusMessage || $ts('failed_to_answer_question'), color: 'error' });
            return false;
        }
        toast.add({ title: $ts('success'), description: response.statusMessage || $ts('success_to_answer_question'), color: 'success' });
        return true;
    } catch (error: any) {
        toast.add({ title: $ts('failed'), description: error?.data?.statusMessage || error?.data?.message || error?.statusMessage || error?.message || $ts('failed_to_answer_question'), color: 'error' });
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
    <div class="items-center justify-center mb-24 space-y-8">
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
                <div v-if="step?.id === 'cover'" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div class="mb-8 text-center max-w-2xl mx-auto">
                        <UIcon name="i-heroicons-document-text" class="w-16 h-16 text-primary-500 mb-4 opacity-80" />
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">Selamat Datang!</h3>
                        <p class="text-gray-600 dark:text-gray-400">Silakan ikuti proses pendaftaran ini langkah demi
                            langkah. Pastikan data yang Anda isi valid dan benar.</p>
                    </div>

                    <div
                        class="bg-primary-50/50 dark:bg-primary-900/10 rounded-3xl p-6 md:p-8 max-w-3xl mx-auto ring-1 ring-primary-100 dark:ring-primary-900/50">
                        <h4 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <UIcon name="i-heroicons-shield-check" class="w-5 h-5 text-primary-500" />
                            Syarat dan Ketentuan
                        </h4>
                        <div
                            class="prose dark:prose-invert text-sm text-gray-600 dark:text-gray-300 max-w-none space-y-4">
                            <p>Dengan mendaftar pada acara ini, Anda menyetujui bahwa:</p>
                            <ul class="list-disc pl-5 space-y-2">
                                <li>Data yang diberikan adalah benar dan dapat dipertanggungjawabkan.</li>
                                <li>Panitia berhak membatalkan keikutsertaan jika ditemukan pelanggaran data.</li>
                                <li>Akses E-Ticket bersifat rahasia dan tidak untuk disebarluaskan.</li>
                            </ul>
                        </div>
                        <UFormField :error="errors.agreed?.message"
                            class="mt-8 pt-6 border-t border-primary-200/50 dark:border-primary-800/50">
                            <UCheckbox v-model="formCover.agreed" class="font-medium">
                                <template #label>
                                    Saya telah membaca dan menyetujui <a
                                        href="https://docs.himatika-itsnupekalongan.com/terms-and-conditions"
                                        target="_blank"
                                        class="text-primary-600 dark:text-primary-400 hover:underline">Syarat &
                                        Ketentuan (T&C)</a> acara ini.
                                </template>
                            </UCheckbox>
                        </UFormField>
                    </div>
                </div>

                <div v-else-if="step?.id === 'select_ticket'"
                    class="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div class="mb-6 text-center">
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pilih Tiket</h3>
                        <p class="text-gray-500 dark:text-gray-400">Pilih jenis tiket yang tersedia untuk agenda ini.
                        </p>
                    </div>
                    <UFormField :error="errors.ticketModelId?.message">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                            <div v-for="model in ticketModels" :key="(model as any)._id || model.name"
                                class="relative rounded-2xl p-6 transition-all duration-300 transform group" :class="[
                                    (model.quota && (model.sold || 0) >= model.quota) ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
                                    selectedTicketModelId === ((model as any)._id || model.name) ? 'bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-900 ring-2 ring-primary-500 shadow-lg shadow-primary-500/10' : 'bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-primary-300 hover:shadow-md'
                                ]"
                                @click="(model.quota && (model.sold || 0) >= model.quota) ? null : selectedTicketModelId = (model as any)._id || model.name">
                                <div class="flex items-start justify-between">
                                    <div class="flex items-start gap-4">
                                        <div :class="selectedTicketModelId === ((model as any)._id || model.name) ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400' : 'bg-gray-50 dark:bg-gray-900 text-gray-500 group-hover:text-primary-500'"
                                            class="p-4 rounded-full transition-colors mt-1">
                                            <UIcon
                                                :name="model.meetLink ? 'i-heroicons-video-camera' : 'i-heroicons-map-pin'"
                                                class="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p class="font-bold text-xl text-gray-900 dark:text-white">{{ model.name }}
                                            </p>
                                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {{ model.meetLink ? 'Akses Online (Zoom/Meet)' : 'Hadir di Lokasi Acara'
                                                }}
                                            </p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-2xl font-black text-primary-600 dark:text-primary-400">Rp {{
                                            formatCurrency(model.price) }}</p>
                                        <p v-if="model.quota"
                                            class="mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                                            :class="((model.sold || 0) >= model.quota) ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'">
                                            {{ ((model.sold || 0) >= model.quota) ? 'Habis (Sold Out)' : `Sisa Kuota:
                                            ${model.quota -
                                                (model.sold || 0)}` }}
                                        </p>
                                    </div>
                                </div>
                                <div v-if="selectedTicketModelId === ((model as any)._id || model.name)"
                                    class="absolute top-4 right-4 text-primary-500 animate-in zoom-in duration-300">
                                    <UIcon name="i-heroicons-check-circle-solid" class="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </UFormField>
                </div>

                <div v-else-if="step?.id === 'register_as'"
                    class="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div class="mb-8 text-center">
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Daftar Sebagai</h3>
                        <p class="text-gray-500 dark:text-gray-400">Pilih peran pendaftaran yang sesuai dengan status
                            Anda saat ini.</p>
                    </div>

                    <UFormField :error="errors.role?.message" class="max-w-4xl mx-auto">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div v-for="option in registerAsOptions" :key="option.value"
                                @click="registerAs = option.value"
                                class="relative rounded-3xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                                :class="registerAs === option.value ? 'bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-900 ring-2 ring-primary-500 shadow-xl shadow-primary-500/10' : 'bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-primary-300 hover:shadow-md'">
                                <div class="flex items-start gap-4">
                                    <div :class="registerAs === option.value ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'"
                                        class="p-4 rounded-2xl transition-all duration-300">
                                        <UIcon :name="option.icon" class="w-8 h-8" />
                                    </div>
                                    <div class="flex-1">
                                        <h4 class="font-bold text-lg text-gray-900 dark:text-white">{{ option.label }}
                                        </h4>
                                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ option.description
                                            }}</p>
                                    </div>
                                    <UIcon v-if="registerAs === option.value" name="i-heroicons-check-circle-solid"
                                        class="w-6 h-6 text-primary-500 animate-in zoom-in" />
                                </div>
                            </div>
                        </div>
                    </UFormField>

                    <UAlert v-if="!user" color="info" variant="soft" class="mt-8 max-w-4xl mx-auto shadow-sm"
                        icon="i-heroicons-shield-check" title="Pendaftaran Aman Tanpa Password">
                        <template #description>
                            Sistem menggunakan mekanisme <b>Magic Link</b>. E-Ticket dan notifikasi akan dikirimkan
                            langsung ke email Anda yang aktif. Pastikan Anda tidak salah mengetik alamat email.
                        </template>
                    </UAlert>
                </div>

                <div v-else-if="step?.id === 'data_diri'"
                    class="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <UAlert v-if="participant._id" color="success" :title="$ts('already_participant')"
                        :description="$ts('already_participant_desc')" class="mb-6"></UAlert>

                    <div class="mb-6 px-2">
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Data Diri</h3>
                        <p class="text-gray-500 dark:text-gray-400">Lengkapi formulir biodata di bawah ini.</p>
                    </div>

                    <div
                        class="space-y-6 bg-white/50 dark:bg-gray-800/30 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
                        <div :class="['grid gap-6', responsiveClasses.gridCols]">
                            <UFormField :label="$ts('name')" :error="errors.fullName?.message"
                                help="Nama lengkap sesuai identitas">
                                <UInput v-model="formRegistration.fullName" size="xl"
                                    :disabled="isFieldDisabled('fullName')"
                                    class="focus:ring-2 focus:ring-primary-500" />
                            </UFormField>

                            <UFormField :label="$ts('email')" :error="errors.email?.message"
                                help="Email aktif untuk pengiriman E-Ticket">
                                <UInput v-model="formRegistration.email" size="xl" :disabled="isFieldDisabled('email')"
                                    class="focus:ring-2 focus:ring-primary-500" />
                            </UFormField>

                            <UFormField v-if="!user" label="Konfirmasi Email" :error="errors.confirmEmail?.message"
                                help="Ketik ulang email Anda">
                                <UInput v-model="formRegistration.confirmEmail" size="xl"
                                    class="focus:ring-2 focus:ring-primary-500" />
                            </UFormField>

                            <UFormField :label="$ts('phone')" :error="errors.phone?.message"
                                help="Nomor WhatsApp aktif">
                                <UInput v-model="formRegistration.phone" size="xl" :disabled="isFieldDisabled('phone')"
                                    class="focus:ring-2 focus:ring-primary-500" />
                            </UFormField>

                            <template v-if="registerAs !== 'public'">
                                <UFormField :label="$ts('instance')" :error="errors.instance?.message"
                                    help="Nama Universitas / Perguruan Tinggi">
                                    <UInput v-model="formRegistration.instance" size="xl"
                                        :disabled="isFieldDisabled('instance')"
                                        class="focus:ring-2 focus:ring-primary-500" />
                                </UFormField>

                                <UFormField :label="$ts('prodi')" :error="errors.prodi?.message"
                                    help="Program Studi Anda">
                                    <UInput v-model="formRegistration.prodi" size="xl"
                                        :disabled="isFieldDisabled('prodi')"
                                        class="focus:ring-2 focus:ring-primary-500" />
                                </UFormField>

                                <UFormField :label="$ts('NIM')" :error="errors.NIM?.message"
                                    help="Nomor Induk Mahasiswa">
                                    <UInput v-model="formRegistration.NIM" size="xl" :disabled="isFieldDisabled('NIM')"
                                        class="focus:ring-2 focus:ring-primary-500" />
                                </UFormField>

                                <UFormField :label="$ts('semester')" :error="errors.semester?.message"
                                    help="Semester saat ini (Angka)">
                                    <UInput v-model="formRegistration.semester" size="xl"
                                        :disabled="isFieldDisabled('semester')" type="number"
                                        class="focus:ring-2 focus:ring-primary-500" />
                                </UFormField>

                                <UFormField :label="$ts('class')" v-if="registerAs === 'himatika-member'"
                                    :error="errors.class?.message" help="Contoh: A, B, C">
                                    <UInput v-model="formRegistration.class" size="xl"
                                        :disabled="isFieldDisabled('class')"
                                        class="focus:ring-2 focus:ring-primary-500" />
                                </UFormField>
                            </template>

                            <template v-else>
                                <UFormField :label="$ts('instance')" :error="errors.instance?.message"
                                    help="Asal Instansi / Perusahaan (Opsional)">
                                    <UInput v-model="formRegistration.instance" size="xl"
                                        :disabled="isFieldDisabled('instance')"
                                        class="focus:ring-2 focus:ring-primary-500" />
                                </UFormField>
                            </template>

                            <p v-if="checkIfProdiIsInformatics"
                                class="md:col-span-2 text-red-500 dark:text-red-400 mt-2 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
                                <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 inline mr-2" />
                                ** {{ $ts('is_informatics_message') }} <ULink to="/register"
                                    class="font-bold underline">{{ $ts('here')
                                    }}</ULink>
                            </p>
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
                        <h3 class="text-lg font-semibold mb-4">Pilih Metode Pembayaran</h3>

                        <div class="space-y-6">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                                <div v-for="option in paymentMethods" :key="option.value"
                                    class="relative rounded-2xl p-4 md:p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
                                    :class="formSelectPayment.method === option.value ? 'bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-900 ring-2 ring-primary-500 shadow-md' : 'bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-primary-400'"
                                    @click="formSelectPayment.method = option.value; formSelectPayment.bank = 'bca'">
                                    <div class="flex flex-col items-center gap-3 text-center">
                                        <div :class="formSelectPayment.method === option.value ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400' : 'bg-gray-50 dark:bg-gray-900 text-gray-500 group-hover:text-primary-500'"
                                            class="p-3 rounded-full transition-colors">
                                            <UIcon :name="option.icon" class="w-7 h-7" />
                                        </div>
                                        <span class="font-bold text-sm transition-colors"
                                            :class="formSelectPayment.method === option.value ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'">{{
                                                option.label }}</span>
                                    </div>
                                    <div v-if="formSelectPayment.method === option.value"
                                        class="absolute top-3 right-3 text-primary-500 animate-in zoom-in duration-300">
                                        <UIcon name="i-heroicons-check-circle-solid" class="w-5 h-5" />
                                    </div>
                                </div>
                            </div>

                            <div v-if="formSelectPayment.method === 'bank_transfer'" class="animate-fade-in mt-6">
                                <UFormField label="Pilih Bank" help="Pilih bank untuk pembayaran Virtual Account">
                                    <URadioGroup v-model="formSelectPayment.bank" :items="vaBanks"
                                        class="grid grid-cols-2 sm:grid-cols-4 gap-3" :ui="{ fieldset: 'w-full' }">
                                        <template #label="{ item }">
                                            <div class="flex flex-col items-center justify-center p-2">
                                                <span class="font-bold text-gray-700 dark:text-gray-200">{{ item.label
                                                    }}</span>
                                            </div>
                                        </template>
                                    </URadioGroup>
                                </UFormField>
                            </div>

                            <div v-if="formSelectPayment.method === 'manual_transfer'" class="animate-fade-in mt-6">
                                <UFormField label="Pilih Rekening Tujuan"
                                    help="Pilih rekening bank atau e-wallet yang dituju">
                                    <URadioGroup v-model="formSelectPayment.manual_target"
                                        :items="(agenda?.configuration?.manualPayments || []).map(p => ({ label: p.name, account: p.account, owner: p.owner, value: p.name }))"
                                        class="grid grid-cols-1 md:grid-cols-2 gap-3" :ui="{ fieldset: 'w-full' }">
                                        <template #label="{ item }">
                                            <div class="flex flex-col">
                                                <span class="font-bold text-gray-900 dark:text-white">{{ item.label
                                                    }}</span>
                                                <span class="text-sm font-mono text-gray-600 dark:text-gray-400">{{
                                                    item.account }}</span>
                                                <span class="text-xs text-gray-500">a.n {{ item.owner }}</span>
                                            </div>
                                        </template>
                                    </URadioGroup>
                                </UFormField>
                            </div>

                            <div v-if="formSelectPayment.method !== 'cash'"
                                class="relative bg-white dark:bg-gray-900 rounded-2xl p-4 md:p-6 mt-8 border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden group hover:border-primary-200 dark:hover:border-primary-900/50 transition-colors">
                                <!-- Receipt Header Accent -->
                                <div
                                    class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-indigo-500">
                                </div>
                                <h4
                                    class="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2 uppercase tracking-widest text-xs">
                                    <UIcon name="i-heroicons-receipt-percent" class="w-5 h-5 text-primary-500" />
                                    Ringkasan Pembayaran
                                </h4>
                                <div class="space-y-4 font-mono text-sm">
                                    <div class="flex justify-between items-center">
                                        <span class="text-gray-500 dark:text-gray-400">Harga Tiket</span>
                                        <span class="font-medium text-gray-900 dark:text-gray-100">Rp {{
                                            formatCurrency(priceSummary.base) }}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-gray-500 dark:text-gray-400">Biaya Layanan</span>
                                        <span class="font-medium text-gray-900 dark:text-gray-100">Rp {{
                                            formatCurrency(priceSummary.admin) }}</span>
                                    </div>
                                    <div
                                        class="pt-4 border-t-2 border-dashed border-gray-200 dark:border-gray-800 flex justify-between items-center">
                                        <span class="font-bold text-gray-900 dark:text-white text-base font-sans">Total
                                            Pembayaran</span>
                                        <span
                                            class="font-black text-2xl text-primary-600 dark:text-primary-400 drop-shadow-sm">Rp
                                            {{
                                                formatCurrency(priceSummary.total) }}</span>
                                    </div>
                                </div>
                            </div>

                            <div v-else
                                class="relative overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 p-5 rounded-2xl border border-amber-200 dark:border-amber-800/50 shadow-sm mt-8">
                                <div class="flex gap-4 relative z-10">
                                    <div class="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-xl h-fit hidden sm:block">
                                        <UIcon name="i-heroicons-wallet"
                                            class="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div class="space-y-1 text-sm text-amber-900 dark:text-amber-100 w-full">
                                        <p class="font-bold text-base flex items-center gap-2">
                                            <UIcon name="i-heroicons-wallet" class="w-5 h-5 sm:hidden" />
                                            Pembayaran Tunai (Cash)
                                        </p>
                                        <p>Silakan datang ke sekretariat panitia untuk melakukan pembayaran secara
                                            tunai.</p>
                                        <div
                                            class="mt-4 pt-3 border-t border-amber-200/50 dark:border-amber-800/50 flex items-center justify-between">
                                            <span class="font-medium">Total Tagihan:</span>
                                            <strong class="text-xl text-amber-700 dark:text-amber-300 font-mono">Rp {{
                                                formatCurrency(priceSummary.total) }}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else-if="step?.id === 'payment'">
                    <PaymentDetail :amount="agenda?.configuration.participant.amount" :payment="formSelectPayment"
                        :agenda-id="id"
                        :registered-id="participant?._id as string || registrationId as string || undefined"
                        @cancel="onCancelPayment" />
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
<style scoped></style>