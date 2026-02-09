/**
* This Vue component is used for registering to an agenda.
*
* Script Setup:
* - Imports necessary types and hooks.
* - Defines the page metadata with layout and authentication settings.
* - Retrieves the route parameter `id`.
* - Determines if the current view is on a mobile device.
* - Fetches user authentication data.
* - Fetches agenda data based on the `id` parameter.
* - Computes breadcrumb links for navigation.
* - Computes the steps for the registration process.
* - Initializes reactive form data for registration, payment, and confirmation.
* - Defines options for the "register as" radio group.
* - Computes responsive classes and sizes for UI elements.
* - Checks if the selected program of study (prodi) is related to informatics.
*
* Template:
* - Renders a breadcrumb component for navigation.
* - Renders a stepper component for the registration process.
* - Displays different form fields based on the current step and registration type.
* - Shows a message if the selected program of study is related to informatics.
*
* Components:
* - UBreadcrumb: Displays breadcrumb navigation links.
* - CoreStepper: Manages the steps of the registration process.
* - UFormField: Groups form elements with labels.
* - URadioGroup: Displays radio buttons for selecting registration type.
* - UInput: Input fields for various form data.
* - USeparator: Separator element for separating sections.
* - ULink: Link component for navigation.
*
* Computed Properties:
* - `isMobile`: Determines if the current view is on a mobile device.
* - `agenda`: Retrieves the agenda data from the fetched response.
* - `links`: Generates breadcrumb links based on the agenda data.
* - `steps`: Generates the steps for the registration process.
* - `responsiveClasses`: Computes responsive classes for UI elements.
* - `responsiveUISizes`: Computes responsive sizes for UI elements.
* - `checkIfProdiIsInformatics`: Checks if the selected program of study is related to informatics.
*
* Reactive Data:
* - `activeStep`: Tracks the current active step in the registration process.
* - `formData`: Stores the form data for registration, payment, and confirmation.
* - `registerAsOptions`: Options for the "register as" radio group.
*/
<script setup lang='ts'>
import type { IMember, IParticipant, IPaymentMethod } from '~~/types';
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
const { tab, participantId } = route.query as { tab: string; participantId: string };

const { $api } = useNuxtApp()

const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);

const { data: user } = useAuth();

const { data: agenda, refresh } = useAsyncData('agenda', async () => $api<IAgendaResponse>(`/api/agenda/${id}`, {
    method: 'GET',
}), {
    transform: (data) => data.data?.agenda,
});
const { data: participantData, refresh: refreshParticipant } = useAsyncData(() => $api<IParticipantResponse>(`/api/agenda/${id}/participant/me`, {
    method: 'GET',
    query: {
        participantId: participantId || undefined,
    }
}), {
    transform: (data) => {
        return data.data?.participant;
    }
});
const participant = computed<IParticipant>(() => {
    if (participantData.value) {
        if (participantData.value.member) {
            return {
                ...participantData.value,
                member: participantData.value.member,
                guest: undefined,
            }
        }
        if (participantData.value.guest) {
            return {
                ...participantData.value,
                guest: participantData.value.guest,
                member: undefined,
            }
        }
    }
    return {
        _id: '',
        payment: {
            _id: '',
            method: 'cash',
            amount: 0,
            proof: '',
            status: 'pending',
            createdAt: '',
            updatedAt: '',
        },
        member: user.value?.member,
        guest: undefined,
    };
});
const registrationId = computed(() => participantId || participant.value?._id || '');

const { data: questions, refresh: refreshQuestions } = useAsyncData(() => $api<IAnswersResponse>(`/api/agenda/${id}/participant/question/answer/${registrationId.value}`, {
    method: 'GET',
}), {
    transform: (data) => {
        return data.data?.answers;
    },
    default: () => [],
    watch: [registrationId],
});
const links = computed(() => [
    { label: 'Beranda', to: '/' },
    { label: 'Agenda', to: '/agendas' },
    { label: agenda.value?.title || '', to: `/agendas/${id}` },
    { label: 'Daftar' }
]);
const steps = computed<Step[]>(() => {
    const steps: Step[] = [
        { id: 'registration', label: 'Daftar', title: 'Daftar', formData: formRegistration, validationRules: validationRuleRegistration, onNext: participant.value._id ? nextToAnswerQuestion : register },
        { id: 'answer_question', label: 'Answer Question', title: 'Answer Question', formData: {}, validationRules: {}, onNext: handleAnswer },
        { id: 'select_payment', label: 'Select Payment', title: 'Select Payment', formData: formPayment, validationRules: validationRulePayment, onNext: formPayment.method !== 'cash' ? payment : undefined },
        { id: 'payment', label: 'Pembayaran', title: 'Pembayaran', formData: formConfirmation, validationRules: validationRuleConfirmation },
        { id: 'success', label: 'Berhasil!', title: 'Berhasil!', formData: {} }
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

const registerAs = ref(participant.value?.guest ? participant.value?.guest?.instance ? 'non-student' : 'student-guest' : 'student');
const formRegistration = reactiveComputed(() => ({
    registerAs: 'student',
    fullName: (participant.value?.member as IMember)?.fullName || participant.value?.guest?.fullName || '',
    email: (participant.value?.member as IMember)?.email || participant.value?.guest?.email || '',
    phone: (participant.value?.member as IMember)?.phone || participant.value?.guest?.phone || '',
    NIM: (participant.value?.member as IMember)?.NIM || participant.value?.guest?.NIM || 0,
    class: (participant.value?.member as IMember)?.class || participant.value?.guest?.class || '',
    semester: (participant.value?.member as IMember)?.semester || participant.value?.guest?.semester || 0,
    prodi: participant.value?.guest?.prodi || '',
    instance: participant.value?.guest?.instance || '',
}));
const formPayment = reactiveComputed(() => ({
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
const formConfirmation = reactiveComputed(() => ({
    status: formPayment.status || 'pending',
}));
const checkIfProdiIsInformatics = computed(() => {
    const prodi = formRegistration.prodi?.toLowerCase().replace(/\s+/g, '') ?? '';
    return ['informatics', 'informatika', 'computerscience', 'cs', 'it', 'informationtechnology'].includes(prodi);
});
const registerAsOptions = ref([
    { label: 'Mahasiswa', value: 'student' },
    { label: 'Non-Mahasiswa', value: 'non-student' },
    { label: 'Tamu Mahasiswa', value: 'student-guest' },
]);
const paymentMethods = ref<{ label: string; value: IPaymentMethod; icon: string; }[]>([
    { label: 'Tunai', value: 'cash', icon: 'i-heroicons-banknotes' },
    { label: 'Transfer', value: 'bank_transfer', icon: 'i-heroicons-credit-card' },
    { label: 'Qris', value: 'qris', icon: 'i-heroicons-qr-code' }
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

/** 
 * method to validate form data
 */

const nextToAnswerQuestion = async () => {
    refreshParticipant();
    refreshQuestions();
}

const register = async (): Promise<boolean | FormError> => {
    try {
        const { data, statusCode, statusMessage } = await $api<IAgendaRegisterResponse>(`/api/agenda/${id}/participant/register`, {
            method: 'POST',
            body: {
                guest: formRegistration
            }
        });
        if (statusCode === 200 && data) {
            refreshParticipant();
            return true;
        } else {
            toast.add({
                title: 'Failed',
                description: statusMessage || 'Failed To Register',
                color: 'error',
            })
            return false;
        }
    } catch (error) {
        toast.add({
            title: 'Failed',
            description: 'Failed To Register',
            color: 'error',
        })
        return false;
    }
}
const payment = async (): Promise<boolean | FormError> => {
    const RegistrationId = participant.value._id || registrationId.value || '';
    if (!RegistrationId) {
        toast.add({
            title: 'Failed',
            description: 'Failed To Register Payment',
            color: 'error',
        })
        return false;
    }
    try {
        const { data, statusCode } = await $fetch<IAgendaRegisterResponse>(`/api/agenda/${id}/participant/register/${RegistrationId}/payment`, {
            method: 'POST',
            body: {
                payment_method: formPayment.method,
                bank_transfer: formPayment.bank,
            } as IPaymentBody
        });
        if (statusCode === 200 && data) {
            refreshParticipant();
            return true;
        } else {
            toast.add({
                title: 'Failed',
                description: 'Failed To Register Payment',
                color: 'error',
            })
            return false;
        }
    } catch (error) {
        toast.add({
            title: 'Failed',
            description: 'Failed To Register Payment',
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
    gridCols: isMobile.value ? 'grid-cols-1' : 'grid-cols-6',
    container: isMobile.value ? 'p-2' : 'p-3',
}));

const responsiveUISizes = computed<{ [key: string]: 'xs' | 'md' }>(() => ({
    button: isMobile.value ? 'xs' : 'md',
    input: isMobile.value ? 'xs' : 'md',
}));

const validationRuleRegistration: FieldValidationRules = reactiveComputed(() => ({
    registerAs: (value: string) => value ? null : { message: 'Register As Required', path: 'registerAs' },
    fullName: (value: string) => {
        if (user.value) return null;
        if (participant.value) return null;
        return value ? null : { message: 'Name Required', path: 'fullName' };
    },
    email: (value: string) => {
        if (user.value) return null;
        if (participant.value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return value && emailRegex.test(value) ? null : { message: 'Valid Email', path: 'email' };
    },
    phone: (value: string) => {
        if (user.value) return null;
        if (participant.value) return null;
        const phoneRegex = /^\d{10,15}$/;
        return value && phoneRegex.test(value.replace(/\D/g, '')) ? null : { message: 'Valid Phone', path: 'phone' };
    },
    NIM: (value: number) => {
        if (user.value) return null;
        if (participant.value) return null;
        if (registerAs.value === 'student' || registerAs.value === 'student-guest') {
            return value > 0 ? null : { message: 'NIM Required', path: 'NIM' };
        }
        return null;
    },
    class: (value: string) => {
        if (user.value) return null;
        if (participant.value) return null;
        if (registerAs.value === 'student' || registerAs.value === 'student-guest') {
            return value ? null : { message: 'Class Required', path: 'class' };
        }
        return null;
    },
    semester: (value: number) => {
        if (user.value) return null;
        if (participant.value) return null;
        if (registerAs.value === 'student' || registerAs.value === 'student-guest') {
            return value > 0 ? null : { message: 'Semester Required', path: 'semester' };
        }
        return null;
    },
    prodi: (value: string) => {
        if (user.value) return null;
        if (participant.value) return null;
        if (registerAs.value === 'student' || registerAs.value === 'student-guest') {
            return value ? null : { message: 'Prodi Required', path: 'prodi' };
        }
        return null;
    },
    instance: (value: string) => {
        if (user.value) return null;
        if (participant.value) return null;
        if (registerAs.value === 'student-guest' || registerAs.value === 'non-student') {
            return value ? null : { message: 'Instance Required', path: 'instance' };
        }
        return null;
    },
}));
const validationRulePayment: FieldValidationRules = reactiveComputed(() => ({
    method: (value: string) => value ? null : { message: 'Payment Method Required', path: 'method' },
    bank: (value: string) => value ? null : { message: 'Bank Required', path: 'bank' },
}));
const validationRuleConfirmation: FieldValidationRules = reactiveComputed(() => ({
    status: (value: string) => formPayment.method !== 'cash' ? (value ? null : { message: 'Confirmation Required', path: 'status' }) : null,
    // confirmation: (value: string) => value ? null : 'Confirmation Required',
}));
const onCompleted = async () => {
    // TODO: CREATE TICKET PAGE
    router.push(`/agendas/${id}/participant`);
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
        const response = await $api<IResponse & { data: string }>(`api/agenda/${id}/participant/question/answer/${registrationId.value}`, {
            method: 'POST',
            body: formData,
        });
        if (response.statusCode !== 200) {
            toast.add({ title: 'Failed', description: 'Failed To Answer Question', color: 'error' });
            return false;
        }
        toast.add({ title: 'Berhasil!', description: 'Success To Answer Question', color: 'success' });
        return true;
    } catch (error) {
        toast.add({ title: 'Berhasil!', description: 'Failed To Answer Question', color: 'error' });
        return false;
    }
}
onMounted(() => {
    setTimeout(() => {
        if (tab === 'register') {
            activeStep.value = 0;
        } else if (tab === 'answer_question') {
            activeStep.value = 1;
        } else if (tab === 'select_payment') {
            activeStep.value = 2;
        } else if (tab === 'payment') {
            activeStep.value = 3;
        } else if (tab === 'success') {
            activeStep.value = 4;
        } else {
            activeStep.value = 0;
        }
        if (!participant.value?.guest && !participant.value?.member) {
            toast.add({
                title: 'You are not registered as a participant',
                description: 'Please register first.',
                color: 'error',
            })
        }
    }, 1000);

});
watch(participant, (newValue) => {
    if (!newValue?.guest && !newValue?.member) {
        const route = useRoute();
        route.query = {
            participantId: '',
        }
        toast.add({
            title: 'Failed',
            description: 'Participant Not Found',
            color: 'error',
        })
    }
})
</script>
<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :items="links" />
        <CoreStepper :steps="steps" v-model="activeStep" validate-on-change @complete="onCompleted"
            :prev-button-text="'Sebelumnya'" :next-button-text="'Selanjutnya'" :complete-button-text="'Selesai'">
            <template #default="{ step, errors }">
                <div v-if="step?.id === 'registration'">
                    <UAlert v-if="participant._id" color="success" :title="'Already Participant'"
                        :description="'Already Participant Desc'" class="mb-4"></UAlert>
                    <div class="flex space-x-4">
                        <UFormField :label="'Register As'" class="col-span-6 px-4"
                            :error="errors.registerAs?.message">
                            <URadioGroup v-model="registerAs" :items="registerAsOptions"
                                :disabled="user ? true : false" />
                        </UFormField>
                    </div>
                    <USeparator class="my-4" />
                    <div class="text-start">
                        <div class="space-y-4" v-if="registerAs">
                            <div :class="['grid gap-2 px-4', responsiveClasses.gridCols]">
                                <UFormField class="col-span-6" :label="'NIM'" v-if="registerAs !== 'non-student'"
                                    :error="errors.NIM?.message">
                                    <UInput v-model="formRegistration.NIM" :size="responsiveUISizes.input"
                                        :disabled="user ? true : false" />
                                </UFormField>
                                <UFormField class="col-span-6" :label="'Nama Lengkap'" :error="errors.fullName?.message">
                                    <UInput v-model="formRegistration.fullName" :size="responsiveUISizes.input"
                                        :disabled="user ? true : false" />
                                </UFormField>
                                <UFormField class="col-span-6" :label="'Email'" :error="errors.email?.message">
                                    <UInput v-model="formRegistration.email" :size="responsiveUISizes.input"
                                        :disabled="user ? true : false" />
                                </UFormField>
                                <UFormField class="col-span-6" :label="'Nomor Telepon'" :error="errors.phone?.message">
                                    <UInput v-model="formRegistration.phone" :size="responsiveUISizes.input"
                                        :disabled="user ? true : false" />
                                </UFormField>
                                <UFormField class="col-span-6" :label="'Kelas'" v-if="registerAs !== 'non-student'"
                                    :error="errors.class?.message">
                                    <UInput v-model="formRegistration.class" :size="responsiveUISizes.input"
                                        :disabled="user ? true : false" />
                                </UFormField>
                                <UFormField class="col-span-6" :label="'Semester'"
                                    v-if="registerAs !== 'non-student'" :error="errors.semester?.message">
                                    <UInput v-model="formRegistration.semester" :size="responsiveUISizes.input"
                                        :disabled="user ? true : false" />
                                </UFormField>
                                <UFormField class="col-span-6" :label="'Prodi'"
                                    v-if="registerAs !== 'non-student' && !user" :error="errors.prodi?.message">
                                    <UInput v-model="formRegistration.prodi" :size="responsiveUISizes.input"
                                        :disabled="user ? true : false" />
                                </UFormField>
                                <UFormField class="col-span-6" :label="'Instansi'"
                                    v-if="registerAs === 'non-student' || registerAs === 'student-guest'"
                                    :error="errors.instance?.message">
                                    <UInput v-model="formRegistration.instance" :size="responsiveUISizes.input"
                                        :disabled="user ? true : false" />
                                </UFormField>
                                <p v-if="checkIfProdiIsInformatics" class="col-span-6 text-red-500 dark:text-red-400">**
                                    {{
                                        'Is Informatics Message' }} <ULink to="/register"
                                        class="text-blue-500 underline">{{
                                            'di sini'
                                        }}</ULink>
                                </p>
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
                        <h3 class="text-lg font-semibold mb-4">{{ 'Select Payment Method' }}</h3>

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
                    <PaymentDetail :amount="agenda?.configuration.participant.amount" :payment="formPayment"
                        @cancel="onCancelPayment" />
                </div>
                <div v-else-if="step?.id === 'success'">
                    <UAlert color="success" :title="'Registration Success'"
                        :description="'Registration Success Desc'" />
                    <CoreContent class="my-4" :content="agenda?.configuration.messageAfterRegister || ''" />
                </div>
            </template>
        </CoreStepper>
    </div>
</template>
<style scoped></style>