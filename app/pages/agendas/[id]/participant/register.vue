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
import { CustomFormData } from '~/helpers/CustomFormData';
import type { FieldValidationRules, FormError, Step } from '~~/types/component/stepper';
import type { IPaymentBody, IReqAnswer } from '~~/types/IRequestPost';
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

const { data: agenda, refresh } = useAsyncData('agenda', async () => $api<IAgendaResponse>('/api/agenda', {
    query: {
        id
    }
}), {
    transform: (data) => data.data?.agenda,
});
const { data: participantData, refresh: refreshParticipant } = useLazyAsyncData<IParticipantResponse>(() => $api(`/api/agenda/${id}/participant/me`, {
    method: 'GET',
    query: {
        participantId: participantId || undefined,
    }
}));
const participant = computed(() => participantData.value?.data?.participant);
const registrationId = computed(() => participant.value?._id || participantId);

const { data: questions } = useLazyAsyncData(() => $api<IAnswersResponse>(`/api/agenda/${id}/participant/question/answer/${registrationId.value}`, {
    method: 'GET',
}), {
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
        { id: 'registration', label: $ts('register'), title: $ts('register'), formData: formRegistration, validationRules: validationRuleRegistration, onNext: participant.value ? refreshParticipant : register },
        { id: 'answer_question', label: $ts('answer_question'), title: $ts('answer_question'), formData: {}, validationRules: {}, onNext: handleAnswer },
        { id: 'select_payment', label: $ts('select_payment'), title: $ts('select_payment'), formData: formPayment, validationRules: validationRulePayment, onNext: formPayment.method === 'transfer' ? payment : undefined },
        { id: 'payment', label: $ts('payment'), title: $ts('payment'), formData: formConfirmation, validationRules: validationRuleConfirmation },
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

const registerAs = ref('student');
const formRegistration = reactiveComputed(() => ({
    registerAs: 'student',
    fullName: user.value?.member.fullName || participant.value?.guest?.fullName || '',
    email: user.value?.member.email || participant.value?.guest?.email || '',
    phone: user.value?.member.phone || participant.value?.guest?.phone || '',
    NIM: user.value?.member.NIM || participant.value?.guest?.NIM || 0,
    class: user.value?.member.class || participant.value?.guest?.fullName || '',
    semester: user.value?.member.semester || participant.value?.guest?.semester || 0,
    prodi: participant.value?.guest?.prodi || '',
    instance: participant.value?.guest?.instance || '',
}));
const formPayment = reactiveComputed(() => ({
    method: participant.value?.payment?.method || 'transfer',
    type: participant.value?.payment?.type || 'bank_transfer',
    status: participant.value?.payment?.status || 'pending',
    order_id: participant.value?.payment?.order_id || '',
    transaction_id: participant.value?.payment?.transaction_id || '',
    bank: participant.value?.payment?.bank || 'bca',
    va_number: participant.value?.payment?.va_number || '',
    time: participant.value?.payment?.time || new Date(),
    expiry: participant.value?.payment?.expiry || new Date(),

}));
const formConfirmation = reactiveComputed(() => ({
    status: formPayment.status || 'pending',
}));
const checkIfProdiIsInformatics = computed(() => {
    const prodi = formRegistration.prodi?.toLowerCase().replace(/\s+/g, '') ?? '';
    return ['informatics', 'informatika', 'computerscience', 'cs', 'it', 'informationtechnology'].includes(prodi);
});
const registerAsOptions = ref([
    { label: $ts('student'), value: 'student' },
    { label: $ts('non_student'), value: 'non-student' },
    { label: $ts('student_guest'), value: 'student-guest' },
]);
const paymentMethods = ref<{ label: string; value: string; }[]>([
    { label: $ts('transfer'), value: 'transfer' },
    { label: $ts('cash'), value: 'cash' },
]);
const paymentTypes = ref([
    { label: $ts('bank_transfer'), value: 'bank_transfer' },
    { label: $ts('credit_card'), value: 'credit_card' },
    { label: $ts('debit_card'), value: 'debit_card' },
    { label: $ts('e_wallet'), value: 'e_wallet' },
    { label: $ts('other'), value: 'other' },
]);
const banks = ref([
    { label: 'BCA', value: 'bca' },
    { label: 'BNI', value: 'bni' },
    { label: 'BRI', value: 'bri' },
    { label: 'Mandiri', value: 'mandiri' },
]);

/** 
 * method to validate form data
 */

const register = async (): Promise<boolean | FormError> => {
    try {
        const { data, statusCode, statusMessage } = await $api<IAgendaRegisterResponse>(`/api/agenda/${id}/participant/register`, {
            method: 'POST',
            body: {
                id,
                guest: formRegistration,
            }
        });
        if (statusCode === 200 && data) {
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
    try {
        const { data, statusCode } = await $fetch<IAgendaRegisterResponse>(`/api/agenda/${id}/participant/register/${registrationId.value}/payment`, {
            method: 'POST',
            body: {
                payment_type: formPayment.type,
                bank_transfer: formPayment.bank,
            } as IPaymentBody
        });
        if (statusCode === 200 && data) {
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
    gridCols: isMobile.value ? 'grid-cols-1' : 'grid-cols-6',
    container: isMobile.value ? 'p-2' : 'p-3',
}));

const responsiveUISizes = computed<{ [key: string]: 'xs' | 'md' }>(() => ({
    button: isMobile.value ? 'xs' : 'md',
    input: isMobile.value ? 'xs' : 'md',
}));

const validationRuleRegistration: FieldValidationRules = reactiveComputed(() => ({
    registerAs: (value: string) => value ? null : { message: $ts('register_as_required'), path: 'registerAs' },
    fullName: (value: string) => {
        if (user.value) return null;
        if (participant.value) return null;
        return value ? null : { message: $ts('name_required'), path: 'fullName' };
    },
    email: (value: string) => {
        if (user.value) return null;
        if (participant.value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return value && emailRegex.test(value) ? null : { message: $ts('valid_email'), path: 'email' };
    },
    phone: (value: string) => {
        if (user.value) return null;
        if (participant.value) return null;
        const phoneRegex = /^\d{10,15}$/;
        return value && phoneRegex.test(value.replace(/\D/g, '')) ? null : { message: $ts('valid_phone'), path: 'phone' };
    },
    NIM: (value: number) => {
        if (user.value) return null;
        if (participant.value) return null;
        if (registerAs.value === 'student' || registerAs.value === 'student-guest') {
            return value > 0 ? null : { message: $ts('NIM_required'), path: 'NIM' };
        }
        return null;
    },
    class: (value: string) => {
        if (user.value) return null;
        if (participant.value) return null;
        if (registerAs.value === 'student' || registerAs.value === 'student-guest') {
            return value ? null : { message: $ts('NIM_required'), path: 'NIM' };
        }
        return value ? null : { message: $ts('class_required'), path: 'class' };
    },
    semester: (value: number) => {
        if (user.value) return null;
        if (participant.value) return null;
        if (registerAs.value === 'student' || registerAs.value === 'student-guest') {
            return value > 0 ? null : { message: $ts('NIM_required'), path: 'NIM' };
        }
        return value > 0 ? null : { message: $ts('semester_required'), path: 'semester' };
    },
    prodi: (value: string) => {
        if (user.value) return null;
        if (participant.value) return null;
        if (registerAs.value === 'student' || registerAs.value === 'student-guest') {
            return value ? null : { message: $ts('prodi_required'), path: 'prodi' };
        }
        return null;
    },
    instance: (value: string) => {
        if (user.value) return null;
        if (participant.value) return null;
        if (registerAs.value === 'student-guest' || registerAs.value === 'non-student') {
            return value ? null : { message: $ts('instance_required'), path: 'instance' };
        }
        return null;
    },
}));
const validationRulePayment: FieldValidationRules = reactiveComputed(() => ({
    method: (value: string) => value ? null : { message: $ts('payment_method_required'), path: 'method' },
    type: (value: string) => value ? null : { message: $ts('payment_type_required'), path: 'type' },
    bank: (value: string) => value ? null : { message: $ts('bank_required'), path: 'bank' },
}));
const validationRuleConfirmation: FieldValidationRules = reactiveComputed(() => ({
    status: (value: string) => formPayment.method === 'transfer' ? (value ? null : { message: $ts('confirmation_required'), path: 'status' }) : null,
    // confirmation: (value: string) => value ? null : $ts('confirmation_required'),
}));
const onCompleted = async () => {
    router.push(`/agendas/${id}/participant`);
}
// TODO: resolve answer handle
async function handleAnswer() {
    try {
        const body = new CustomFormData<IReqAnswer>();
        questions.value?.forEach((question) => {
            body.append('answers', question.answer);
        });
        // {
        //         answers: questions.value?.map((question) => {
        //             return {
        //                 questionId: question.question._id,
        //                 answer: question.answer,
        //             };
        //         }),
        //     }
        const response = await $api<IResponse & { data: string }>(`api/agenda/${id}/participant/question/answer/${registrationId.value}`, {
            method: 'POST',
            body,
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
        <CoreStepper :steps="steps" v-model="activeStep" validate-on-change @complete="onCompleted"
            :prev-button-text="$ts('previous')" :next-button-text="$ts('next')" :complete-button-text="$ts('complete')">
            <template #default="{ step, errors }">
                <div v-if="step?.id === 'registration'">
                    <UAlert v-if="participant" color="success" :title="$ts('already_participant')"
                        :description="$ts('already_participant_desc')" class="mb-4"></UAlert>
                    <div class="flex space-x-4">
                        <UFormField :label="$ts('register_as')" class="col-span-6 px-4"
                            :error="errors.registerAs?.message">
                            <URadioGroup v-model="registerAs" :items="registerAsOptions"
                                :disabled="user ? true : false" />
                        </UFormField>
                    </div>
                    <USeparator class="my-4" />
                    <div class="text-start">
                        <div class="space-y-4" v-if="registerAs">
                            <div :class="['grid gap-2 px-4', responsiveClasses.gridCols]">
                                <UFormField class="col-span-6" :label="$ts('NIM')" v-if="registerAs !== 'non-student'"
                                    :error="errors.NIM?.message">
                                    <UInput v-model="formRegistration.NIM" :size="responsiveUISizes.input"
                                        :disabled="user ? true : false" />
                                </UFormField>
                                <UFormField class="col-span-6" :label="$ts('name')" :error="errors.fullName?.message">
                                    <UInput v-model="formRegistration.fullName" :size="responsiveUISizes.input"
                                        :disabled="user ? true : false" />
                                </UFormField>
                                <UFormField class="col-span-6" :label="$ts('email')" :error="errors.email?.message">
                                    <UInput v-model="formRegistration.email" :size="responsiveUISizes.input"
                                        :disabled="user ? true : false" />
                                </UFormField>
                                <UFormField class="col-span-6" :label="$ts('phone')" :error="errors.phone?.message">
                                    <UInput v-model="formRegistration.phone" :size="responsiveUISizes.input"
                                        :disabled="user ? true : false" />
                                </UFormField>
                                <UFormField class="col-span-6" :label="$ts('class')" v-if="registerAs !== 'non-student'"
                                    :error="errors.class?.message">
                                    <UInput v-model="formRegistration.class" :size="responsiveUISizes.input"
                                        :disabled="user ? true : false" />
                                </UFormField>
                                <UFormField class="col-span-6" :label="$ts('semester')"
                                    v-if="registerAs !== 'non-student'" :error="errors.semester?.message">
                                    <UInput v-model="formRegistration.semester" :size="responsiveUISizes.input"
                                        :disabled="user ? true : false" />
                                </UFormField>
                                <UFormField class="col-span-6" :label="$ts('prodi')"
                                    v-if="registerAs !== 'non-student' && !user" :error="errors.prodi?.message">
                                    <UInput v-model="formRegistration.prodi" :size="responsiveUISizes.input"
                                        :disabled="user ? true : false" />
                                </UFormField>
                                <UFormField class="col-span-6" :label="$ts('instance')"
                                    v-if="registerAs === 'non-student' || registerAs === 'student-guest'"
                                    :error="errors.instance?.message">
                                    <UInput v-model="formRegistration.instance" :size="responsiveUISizes.input"
                                        :disabled="user ? true : false" />
                                </UFormField>
                                <p v-if="checkIfProdiIsInformatics" class="col-span-6 text-red-500 dark:text-red-400">**
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
                    <div class="space-y-4">
                        <CoreQuestion v-for="(question, index) in questions" :key="index" :question="question.question"
                            v-model="question.answer" />
                    </div>
                </div>
                <div v-else-if="step?.id === 'select_payment'">
                    <div :class="responsiveClasses.container">
                        <p class="mb-4">{{ $ts('selected_payment_method') }}</p>
                        <UFormField :label="$ts('payment_method')" v-if="agenda?.configuration.participant.amount"
                            class="mb-4" :help="$ts('payment_method_desc')">
                            <USelect v-model="formPayment.method" :items="paymentMethods" />
                        </UFormField>
                        <p class="mb-4 text-sm dark:text-gray-400">*{{ $ts('payment_help') }}</p>
                        <p class="text-sm text-red-500 dark:text-red-400">**{{ $ts('if_guest') }}</p>
                        <div v-if="formPayment.method === 'transfer'" class="flex flex-wrap gap-4">
                            <UFormField :label="$ts('payment_type')" class="flex-1 mb-4"
                                :error="errors.payment_type?.message">
                                <URadioGroup v-model="formPayment.type" :items="paymentTypes" />
                            </UFormField>
                            <UFormField :label="$ts('bank')" class="flex-1 mb-4"
                                v-if="formPayment.type === 'bank_transfer'" :error="errors.bank?.message">
                                <USelect v-model="formPayment.bank" :items="banks" />
                            </UFormField>

                        </div>
                    </div>
                </div>
                <div v-else-if="step?.id === 'payment'">
                    <PaymentDetail v-if="formPayment.method === 'transfer'"
                        :amount="agenda?.configuration.participant.amount" :payment="formPayment"
                        @cancel="onCancelPayment" />
                    <div v-else>
                        <UAlert color="success" :title="$ts('cash_payment')" :description="$ts('cash_payment_desc')" />
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
<style scoped></style>