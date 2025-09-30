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
* - UDivider: Divider element for separating sections.
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
import type { IAgenda, IPayment } from '~~/types';
import type { FieldValidationRules, FormError, Step } from '~~/types/component/stepper';
import type { IPaymentBody } from '~~/types/IRequestPost';
import type { IAgendaRegisterResponse, IAgendaResponse, ICommitteeResponse } from '~~/types/IResponse';
interface IFormData {

    payment: IPayment & {
        bank: string;
    };
    confirmation: {}
}
interface IFormRegistration {
    job: string;
}
definePageMeta({
    layout: 'client',
    middleware: ['sidebase-auth'],
});
const route = useRoute();
const router = useRouter();
const { id } = route.params as { id: string; };
const { tab } = route.query as { tab: string; };

const { $api } = useNuxtApp()

const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);

const { data: user } = useAuth();

const { data: agendaData } = useLazyAsyncData<IAgendaResponse>(() => $api('/api/agenda', {
    method: 'GET',
    query: { id }
}));
const { data: committeeData, refresh: refreshCommittee } = useLazyAsyncData<ICommitteeResponse>(() => $api(`/api/agenda/${id}/committee/me`, {
    method: 'GET',
}));
const agenda = computed<IAgenda | undefined>(() => agendaData.value?.data?.agenda);
const committee = computed(() => committeeData.value?.data?.committee);
const registrationId = computed(() => committee.value?._id);
const { $ts } = useI18n();
const links = computed(() => [
    { label: $ts('home'), to: '/' },
    { label: $ts('agenda'), to: '/agendas' },
    { label: agenda.value?.title || '', to: `/agendas/${id}` },
    { label: $ts('register') }
]);
const steps = computed<Step[]>(() => {
    const steps: Step[] = [
        { id: 'registration', label: $ts('register'), title: $ts('register'), formData: formRegistration, validationRules: validationRuleRegistration, onNext: committee.value ? refreshCommittee : register },
        { id: 'select_payment', label: $ts('select_payment'), title: $ts('select_payment'), formData: formPayment, validationRules: validationRulePayment, onNext: formPayment.method === 'transfer' ? payment : undefined },
        { id: 'payment', label: $ts('payment'), title: $ts('payment'), formData: formConfirmation, validationRules: validationRuleConfirmation },
        { id: 'success', label: $ts('success'), title: $ts('success'), formData: {} }
    ];
    return steps.filter(step => ['select_payment', 'payment'].includes(step.id) && (agenda.value?.configuration.committee.amount ?? 0) > 0 || (step.id !== 'payment' && step.id !== 'select_payment'));
});
const activeStep = ref(0);

const jobAvailablesItems = computed(() => {
    return agenda.value?.configuration.committee.jobAvailables?.map((item) => ({
        label: item.label,
        value: item.label,
        disabled: agenda.value?.committees ? agenda.value?.committees.filter(c => c.job === item.label && c.approved).length >= item.count : false,
    })) || [];
});

const formRegistration = reactiveComputed<IFormRegistration>(() => ({
    job: committee.value?.job || '',
}));

const formPayment = reactiveComputed(() => ({
    method: committee.value?.payment?.method || 'transfer',
    type: committee.value?.payment?.type || 'bank_transfer',
    status: committee.value?.payment?.status || 'pending',
    order_id: committee.value?.payment?.order_id || '',
    transaction_id: committee.value?.payment?.transaction_id || '',
    bank: committee.value?.payment?.bank || 'bca',
    va_number: committee.value?.payment?.va_number || '',
    time: committee.value?.payment?.time || new Date(),
    expiry: committee.value?.payment?.expiry || new Date(),

}));
const formConfirmation = reactiveComputed(() => ({
    status: formPayment.status || 'pending',
}));
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
        const { data, statusCode } = await $api<IAgendaRegisterResponse>(`/api/agenda/${id}/committee/register`, {
            method: 'POST',
            body: {
                job: formRegistration.job,
            }
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
                payment_type: formPayment.type,
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
        return false;
    }
}
const onCancelPayment = async () => {
    refreshCommittee();
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

const validationRuleRegistration: FieldValidationRules<IFormRegistration> = reactiveComputed(() => ({
    job: (value: string) => value ? null : { message: $ts('job_required'), path: 'job' },
}));
const validationRulePayment: FieldValidationRules = reactiveComputed(() => ({
    method: (value: string) => value ? null : { message: $ts('payment_method_required'), path: 'method' },
    type: (value: string) => value ? null : { message: $ts('payment_type_required'), path: 'type' },
    bank: (value: string) => value ? null : { message: $ts('bank_required'), path: 'bank' },
}));
const validationRuleConfirmation: FieldValidationRules = reactiveComputed(() => ({
    status: (value: string) => value === 'success' ? null : { message: $ts('status_required'), path: 'status' },
}));
const onCompleted = async () => {
    router.push(`/agendas/${id}/committee`);
}

onMounted(() => {
    setTimeout(() => {
        if (tab === 'register') {
            activeStep.value = 0;
        } else if (tab === 'select_payment') {
            activeStep.value = 1;
        } else if (tab === 'payment') {
            activeStep.value = 2;
        } else if (tab === 'success') {
            activeStep.value = 3;
        } else {
            activeStep.value = 0;
        }
    }, 1000);

})
</script>
<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :links="links" />
        <CoreStepper :steps="steps" v-model="activeStep" validate-on-change @complete="onCompleted"
            :prev-button-text="$ts('previous')" :next-button-text="$ts('next')" :complete-button-text="$ts('complete')">
            <template #default="{ step, errors }">
                <div v-if="step?.id === 'registration'">
                    <UAlert v-if="committee" color="success" :title="$ts('already_committee')"
                        :description="$ts('already_committee_desc')" class="mb-4"></UAlert>
                    <UDivider class="my-4" />
                    <div class="text-start">
                        <div class="space-y-4">
                            <div :class="['grid gap-2 px-4', responsiveClasses.gridCols]">
                                <UFormField class="col-span-full" :label="$ts('job')" :error="errors.job?.message">
                                    <URadioGroup v-model="formRegistration.job" :items="jobAvailablesItems" />
                                </UFormField>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else-if="step?.id === 'select_payment'">
                    <div :class="responsiveClasses.container">
                        <p class="mb-4">{{ $ts('selected_payment_method') }}</p>
                        <UFormField :label="$ts('payment_method')" v-if="agenda?.configuration.committee.amount"
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
                        :amount="agenda?.configuration.committee.amount" :payment="formPayment"
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