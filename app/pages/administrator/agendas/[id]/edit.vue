// TODO:Kadang Error di bagian load data
<script setup lang="ts">
import { CoreStepper, ModalsCategoryAdd, ModalsConfirmation, ModalsJobAdd, ModalsJobEdit, ModalsReqruitmentAdd, ModalsReqruitmentEdit } from '#components';
import { format } from 'date-fns';
import type { IAgenda, IAgendaConfiguration, ICategory, ICommittee, IJob, IMember, IReqruitment } from '~~/types';
import type { FieldValidationRules, Step } from '~~/types/component/stepper';
import type { IReqAgenda } from '~~/types/IRequestPost';
import type { IAgendaResponse, ICategoriesResponse, IMemberResponse, IResponse, ITagsResponse } from '~~/types/IResponse';

definePageMeta({
    middleware: ["sidebase-auth", 'organizer', 'committee'],
    layout: 'dashboard',
});

const route = useRoute();
const router = useRouter();
const overlay = useOverlay();
const toast = useToast();
const { $api } = useNuxtApp();
const { $ts } = useI18n();
const config = useRuntimeConfig();

const { data: agenda } = useAsyncData('agenda', async () => $api<IAgendaResponse>(`/api/agenda/${id}`), {
    transform: (data) => data.data?.agenda,
});

const AddCategoryModal = overlay.create(ModalsCategoryAdd);
const AddJobModal = overlay.create(ModalsJobAdd);
const AddReqruitmentModal = overlay.create(ModalsReqruitmentAdd);
const EditJobModal = overlay.create(ModalsJobEdit);
const EditReqruitmentModal = overlay.create(ModalsReqruitmentEdit);
const ConfirmationModal = overlay.create(ModalsConfirmation);


/**
 * Responsive design setup
 */
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);

const { id } = route.params as { id: string };

/**
 * Responsive UI sizes for components
 */
const responsiveUISizes = computed<{ [key: string]: 'xs' | 'md' }>(() => ({
    button: isMobile.value ? 'xs' : 'md',
    input: isMobile.value ? 'xs' : 'md',
}));

const canSeeAndRegisterOptions = [
    { label: $ts('public'), value: 'Public' },
    { label: $ts('organizer'), value: 'Organizer' },
    { label: $ts('member'), value: 'Member' },
    { label: $ts('none'), value: 'None' },
]
const canSeeAndRegisterOptionsWithNone = [
    { label: $ts('public'), value: 'Public' },
    { label: $ts('organizer'), value: 'Organizer' },
    { label: $ts('member'), value: 'Member' },
    { label: $ts('none'), value: 'None' },
]
const { data: tagsData } = useLazyAsyncData(() => $api<ITagsResponse>('/api/agenda/tags'), {
    transform: (data) => {
        const tags = data.data?.tags || [];
        return tags;
    },
    default: () => undefined,
});
const { data: categoryOptions, refresh: refreshCategory } = useLazyAsyncData(() => $api<ICategoriesResponse>('/api/category'), {
    transform: (data) => {
        const categories = data.data?.categories || [];
        return categories.map((category) => ({
            label: category.title,
            description: category.description,
            value: category._id as string,
        }))
    },
    default: () => []
});
const memberSearchTerm = ref('');
const { data: members, status: memberstatus } = useAsyncData("members", () => $api<IMemberResponse>("/api/member", {
    method: 'GET',
    params: {
        search: memberSearchTerm.value,
    }
}), {
    transform: (data) => {
        const members = data.data?.members || [];
        return members.map((member) => ({
            label: member.fullName,
            email: member.email,
            value: member.NIM,
            avatar: {
                src: `${config.public.public_uri}${member.avatar}`,
                alt: member.fullName
            }
        }));
    },
    default: () => undefined,
    watch: [memberSearchTerm],
});


const configurationState = reactiveComputed<IAgendaConfiguration>(() => {
    return {
        canSee: agenda.value?.configuration?.canSee || 'Public',
        canSeeRegistered: agenda.value?.configuration?.canSeeRegistered || 'Public',
        onlyParticipantCanVisit: agenda.value?.configuration?.onlyParticipantCanVisit || false,
        messageAfterRegister: agenda.value?.configuration?.messageAfterRegister || '',
        committee: {
            pay: agenda.value?.configuration?.committee?.pay || false,
            amount: agenda.value?.configuration?.committee?.amount || 0,
            point: agenda.value?.configuration?.committee?.point || 0,
            reqruitments: agenda.value?.configuration?.committee?.reqruitments || [],
            jobAvailables: agenda.value?.configuration?.committee?.jobAvailables || [],
            canRegister: agenda.value?.configuration?.committee?.canRegister || 'Public',
            canRegisterUntil: {
                start: agenda.value?.configuration?.committee?.canRegisterUntil?.start || new Date(),
                end: agenda.value?.configuration?.committee?.canRegisterUntil?.end || new Date(),
            },
        },
        participant: {
            pay: agenda.value?.configuration?.participant?.pay || false,
            amount: agenda.value?.configuration?.participant?.amount || 0,
            point: agenda.value?.configuration?.participant?.point || 0,
            reqruitments: agenda.value?.configuration?.participant?.reqruitments || [],
            canRegister: agenda.value?.configuration?.participant?.canRegister || 'Public',
            canRegisterUntil: {
                start: agenda.value?.configuration?.participant?.canRegisterUntil?.start || new Date(),
                end: agenda.value?.configuration?.participant?.canRegisterUntil?.end || new Date(),
            },
        }
    };
});
const enableFormCommittee = ref<boolean>((configurationState.committee.questions ?? []).length > 0 || false);
const enableFormParticipant = ref<boolean>((configurationState.participant.questions?.length ?? 0) > 0);
type ICommitteeState = {
    [key: number]: ICommittee;
};
const jobsCommittee = computed(() => [
    { label: 'PIC/Penanggung Jawab' },
    {
        label: 'Ketua Pelaksana',
    },
    {
        label: 'Sekretaris',
    },
    {
        label: 'Bendahara',
    },
    {
        label: 'Humas',
    },
    {
        label: 'Logistik',
    },
    {
        label: 'Dokumentasi',
    },
    {
        label: 'Acara',
    },
    {
        label: 'Sponsorship',
    },
]);
const committeesStateRef = ref<ICommitteeState>({});
watch(agenda, (newAgenda) => {
    if (newAgenda && newAgenda.committees) {
        const committees: ICommitteeState = {};
        newAgenda.committees.forEach((committee, index) => {
            committees[index + 1] = {
                ...committee,
                member: (committee.member as IMember)?.NIM || 0,
            };
        });
        committeesStateRef.value = committees;
    } else {
        committeesStateRef.value = {
            1: {
                job: 'PIC/Penanggung Jawab',
                member: 0,
                approved: true,
                approvedAt: new Date(),
            },
        };
    }
}, { immediate: true });
const committeesState = reactiveComputed<ICommitteeState>(() => {
    return committeesStateRef.value;
});

const addCommittee = () => {
    const newIndex = (Object.keys(committeesStateRef.value).length) + 1;
    committeesStateRef.value[newIndex] = {
        job: '',
        member: 0,
        approved: true,
        approvedAt: new Date(),
    };
};

const removeCommittee = (keyToRemove: number) => {
    const { [keyToRemove]: removed, ...remaining } = committeesStateRef.value;
    const reindexedCommittees: ICommitteeState = {};
    Object.values(remaining).forEach((committee, i) => {
        reindexedCommittees[i + 1] = committee;
    });
    committeesStateRef.value = reindexedCommittees;
};

const state = reactiveComputed<IReqAgenda>(() => {
    return {
        title: agenda.value?.title || '',
        category: (agenda.value?.category as ICategory)?._id as string || '',
        tags: agenda.value?.tags || [],
        description: agenda.value?.description || '',
        at: agenda.value?.at || '',
        atLink: agenda.value?.atLink || '',
        date: {
            start: agenda.value?.date.start || new Date(),
            end: agenda.value?.date.end || new Date(),
        },
        enableSubscription: false,
        configuration: configurationState,
        committees: Object.values(committeesState).map((committee) => {
            return {
                job: committee.job,
                member: committee.member as number,
                approved: committee.approved,
                approvedAt: committee.approvedAt,
            };
        })
    };
});
const stateRules = reactiveComputed<FieldValidationRules<IAgenda>>(() => ({
    title: (value) => {
        if (!value) {
            return { path: 'title', message: $ts('title_required') };
        }
        if (value.length < 3) {
            return { path: 'title', message: $ts('title_min_length', { length: 3 }) }
        }
        if (value.length > 100) {
            return { path: 'title', message: $ts('title_max_length', { length: 100 }) };
        }
        return null;
    },
    category: (value) => {
        if (!value) {
            return { path: 'category', message: $ts('category_required') };
        }
        return null;
    },
    date: (value) => {
        if (!value.start || !value.end) {
            return { path: 'date', message: $ts('date_required') };
        }
        if (value.start > value.end) {
            return { path: 'date', message: $ts('date_invalid') };
        }
        return null;
    },
    at: (value) => {
        if (!value) {
            return { path: 'at', message: $ts('location_required') };
        }
        return null;
    },
    description: (value) => {
        if (!value) {
            return { path: 'description', message: $ts('description_required') };
        }
        if (value.length < 100) {
            return { path: 'description', message: $ts('description_min_length', { length: 3 }) }
        }
        return null;
    },

}));
const configurationStateRules = reactiveComputed<FieldValidationRules<IAgendaConfiguration>>(() => ({
    canSee: (value) => {
        if (!value) {
            return { path: 'canSee', message: $ts('can_see_required') };
        }
        return null;
    },
}));
const committeesStateRules = reactiveComputed<FieldValidationRules<ICommitteeState>>(() => {
    const rules: FieldValidationRules<ICommitteeState> = {};
    for (const key in committeesState) {
        rules[key] = (value) => {
            return null;
        };
    }
    return rules;
});


const loading = ref(false);

const steps = computed<Step[]>(() => [
    {
        id: 'step1',
        label: $ts('general_information'),
        title: $ts('general_information'),
        description: $ts('general_information_description'),
        formData: state,
        validationRules: stateRules,

    },
    {
        id: 'step2',
        label: $ts('configuration'),
        title: $ts('configuration'),
        description: $ts('agenda_configuration_description'),
        formData: configurationState,
        validationRules: configurationStateRules,
    },
    {
        id: 'step3',
        label: $ts('committee'),
        title: $ts('committee'),
        description: $ts('committee_description'),
        formData: committeesState,
        validationRules: committeesStateRules,
    },
    {
        id: 'step4',
        label: $ts('review_your_agenda'),
        title: $ts('review_your_agenda'),
        description: $ts('review_your_agenda_description'),
        formData: {},
        onNext: onSubmit,
    },
])
const tab = ref(0);
async function onSubmit() {
    loading.value = true;
    try {
        const response = await $api<IResponse & { data?: { id: string } }>('api/agenda', {
            method: 'PUT',
            query: {
                id,
            },
            body: state,
        });
        if (response.statusCode === 200) {
            toast.add({
                title: $ts('success'), description: $ts('success_to_edit_agenda', {
                    title: agenda.value?.title || '', date: new Date().toLocaleString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                    })
                }), color: 'success'
            });
            if (enableFormCommittee.value || enableFormParticipant.value) {
                if (enableFormCommittee.value) {
                    window.open(`/agendas/${response.data}/committee/form`, '_blank');
                }
                if (enableFormParticipant.value) {
                    window.open(`/agendas/${response.data}/participant/form`, '_blank');
                }
            } else {
                setTimeout(() => {
                    router.push(`/agendas/${response.data}`);
                }, 3000);

            }
        } else {
            toast.add({
                title: $ts('failed'), description: $ts('failed_to_edit_agenda', {
                    title: agenda.value?.title || '', date: new Date().toLocaleString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                    })
                }), color: 'error'
            });
        }
    } catch (err: any) {
        loading.value = false;
        if (err.response) {
            toast.add({ title: err.response.data.message, color: 'error' });
        } else {
            toast.add({ title: $ts('something_went_wrong'), color: 'error' });
        }
    } finally {
        loading.value = false;
    }
};

const addNewCategory = async (category: string) => {
    AddCategoryModal.open({
        title: category,
        onTriggerRefresh: () => {
            refreshCategory();
            AddCategoryModal.close();
        },
        onClose: () => {
            AddCategoryModal.close();
        },
    })
}
const addNewTag = async (tag: string) => {
    if (!tagsData.value) {
        tagsData.value = [tag];
    }
    tagsData.value.push(tag);
    toast.add({ title: $ts('tag_added', { tag }), color: 'success' });
}

const addNewJob = async () => {
    AddJobModal.open({
        onSubmit: (job: IJob) => {
            const jobAvailable = {
                label: job.label,
                count: job.count,
            };
            if (!configurationState.committee.jobAvailables) {
                configurationState.committee.jobAvailables = [];
            }
            if (configurationState.committee.jobAvailables.some((j) => j.label === jobAvailable.label)) {
                toast.add({ title: $ts('job_available_already_exists', { job: job.label }), color: 'error' });
                return;
            }

            configurationState.committee.jobAvailables.push(jobAvailable);
            AddJobModal.close();
        },
        onClose: () => {
            AddJobModal.close();
        },
    })
}
const addNewReqruitmentCommittee = async () => {
    AddReqruitmentModal.open({
        onSubmit: (reqruitment: IReqruitment) => {
            const reqruitmentAvailable = {
                label: reqruitment.label,
                description: reqruitment.description,
            };
            if (!configurationState.committee.reqruitments) {
                configurationState.committee.reqruitments = [];
            }
            if (configurationState.committee.reqruitments.some((r) => r.label === reqruitmentAvailable.label)) {
                toast.add({ title: $ts('reqruitment_already_exists', { req: reqruitment.label }), color: 'error' });
                return;
            }

            configurationState.committee.reqruitments.push(reqruitmentAvailable);
            AddReqruitmentModal.close();
        },
    })
}
const addNewReqruitmentParticipant = async () => {
    AddReqruitmentModal.open({
        onSubmit: (reqruitment: IReqruitment) => {
            const reqruitmentAvailable = {
                label: reqruitment.label,
                description: reqruitment.description,
            };
            if (!configurationState.participant.reqruitments) {
                configurationState.participant.reqruitments = [];
            }
            if (configurationState.participant.reqruitments.some((r) => r.label === reqruitmentAvailable.label)) {
                toast.add({ title: $ts('reqruitment_already_exists', { req: reqruitment.label }), color: 'error' });
                return;
            }

            configurationState.participant.reqruitments.push(reqruitmentAvailable);
            AddReqruitmentModal.close();
        },
    })
}
const editJob = async (job: IJob, index: number) => {
    EditJobModal.open({
        job: job,
        onSubmit: (job: IJob) => {
            const jobAvailable = {
                label: job.label,
                count: job.count,
            };
            if (!configurationState.committee.jobAvailables) {
                configurationState.committee.jobAvailables = [];
            }
            if (index === -1) {
                toast.add({ title: $ts('job_available_not_found', { job: job.label }), color: 'error' });
                return;
            }
            configurationState.committee.jobAvailables[index] = jobAvailable;
            EditJobModal.close();
        },
        onClose: () => {
            EditJobModal.close();
        },
    })
}
const editReqruitmentCommittee = async (reqruitment: IReqruitment, index: number) => {
    EditReqruitmentModal.open({
        reqruitment: reqruitment,
        onSubmit: (reqruitment: IReqruitment) => {
            const reqruitmentAvailable = {
                label: reqruitment.label,
                description: reqruitment.description,
            };
            if (!configurationState.committee.reqruitments) {
                configurationState.committee.reqruitments = [];
            }
            if (index === -1) {
                toast.add({ title: $ts('reqruitment_not_found', { req: reqruitment.label }), color: 'error' });
                return;
            }
            configurationState.committee.reqruitments[index] = reqruitmentAvailable;
            EditReqruitmentModal.close();
        },
        onClose: () => {
            EditReqruitmentModal.close();
        },
    })
}
const editReqruitmentParticipant = async (reqruitment: IReqruitment, index: number) => {
    EditReqruitmentModal.open({
        reqruitment: reqruitment,
        onSubmit: (reqruitment: IReqruitment) => {
            const reqruitmentAvailable = {
                label: reqruitment.label,
                description: reqruitment.description,
            };
            if (!configurationState.participant.reqruitments) {
                configurationState.participant.reqruitments = [];
            }
            if (index === -1) {
                toast.add({ title: $ts('reqruitment_not_found', { req: reqruitment.label }), color: 'error' });
                return;
            }
            configurationState.participant.reqruitments[index] = reqruitmentAvailable;
            EditReqruitmentModal.close();
        },
        onClose: () => {
            EditReqruitmentModal.close();
        },
    })
}

const deleteJob = async (index: number) => {
    ConfirmationModal.open({
        title: $ts('delete_job_available'),
        body: $ts('delete_job_available_confirmation', {
            job: configurationState.committee.jobAvailables![index]!.label,
        }),
        onConfirm: () => {
            if (!configurationState.committee.jobAvailables) {
                configurationState.committee.jobAvailables = [];
            }
            configurationState.committee.jobAvailables.splice(index, 1);
            ConfirmationModal.close();
        },
        onClose: () => {
            ConfirmationModal.close();
        },
    })
}
const deleteReqruitmentCommittee = async (index: number) => {
    ConfirmationModal.open({
        title: $ts('delete_reqruitment'),
        body: $ts('delete_reqruitment_confirmation', {
            req: configurationState.committee.reqruitments![index]!.label,
        }),
        onConfirm: () => {
            if (!configurationState.committee.reqruitments) {
                configurationState.committee.reqruitments = [];
            }
            configurationState.committee.reqruitments.splice(index, 1);
            ConfirmationModal.close();
        },
        onClose: () => {
            ConfirmationModal.close();
        },
    })
}
const deleteReqruitmentParticipant = async (index: number) => {
    ConfirmationModal.open({
        title: $ts('delete_reqruitment'),
        body: $ts('delete_reqruitment_confirmation', {
            req: configurationState.participant.reqruitments![index]!.label,
        }),
        onConfirm: () => {
            if (!configurationState.participant.reqruitments) {
                configurationState.participant.reqruitments = [];
            }
            configurationState.participant.reqruitments.splice(index, 1);
            ConfirmationModal.close();
        },
        onClose: () => {
            ConfirmationModal.close();
        },
    })
}




const links = computed(() => [
    { label: $ts('dashboard'), to: '/dashboard', icon: 'i-heroicons-home' },
    { label: $ts('agenda'), to: '/dashboard/agendas', icon: 'i-heroicons-clipboard-document-list' },
    { label: agenda.value?.title || '', to: `/agendas/${id}`, icon: 'i-heroicons-document' },
    { label: $ts('edit'), icon: 'i-heroicons-pencil-square' },
]);
</script>

<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :items="links" />
        <CoreStepper class="mt-2" :steps="steps" v-model="tab" :prev-button-text="$ts('previous')"
            :next-button-text="$ts('next')" :complete-button-text="$ts('complete')">
            <template #default="{ step, errors }">
                <div v-if="step?.id === 'step1'">
                    <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
                        <UFormField :label="$ts('title')" v-model="state.title" :error="errors.title?.message"
                            class="col-span-full">
                            <UInput v-model="state.title" :placeholder="$ts('title')" :size="responsiveUISizes.input" />
                        </UFormField>
                        <UFormField :label="$ts('category')" :error="errors.category?.message">
                            <USelectMenu v-model="(state.category as string)" :placeholder="$ts('category')"
                                :items="categoryOptions" label-key="label" value-key="value" class="w-full" create-item
                                @create="addNewCategory" :size="responsiveUISizes.input" />
                        </UFormField>
                        <UFormField :label="$ts('tags')" :error="errors.tags?.message">
                            <USelectMenu v-model="state.tags" :placeholder="$ts('tags')" :items="tagsData" multiple
                                class="w-full" create-item @create="addNewTag" :size="responsiveUISizes.input" />
                        </UFormField>
                        <UFormField :label="`${$ts('date')} & ${$ts('time')}`" name="date" id="date"
                            :class="[isMobile ? 'col-span-full' : 'col-span-2']" required>
                            <RangeDatePicker v-model="state.date" :min="new Date()" />
                        </UFormField>
                        <UFormField :label="$ts('location')" :error="errors.at?.message">
                            <UInput v-model="state.at" :placeholder="$ts('location')" :size="responsiveUISizes.input" />
                        </UFormField>
                        <UFormField :label="$ts('location_link')" :error="errors.atLink?.message">
                            <UInput v-model="state.atLink" :placeholder="$ts('location_link')"
                                :size="responsiveUISizes.input" />
                        </UFormField>
                        <UFormField :label="$ts('description')" :error="errors.description?.message"
                            class="col-span-full">
                            <CoreTiptap v-model="state.description" :placeholder="$ts('description')" />
                        </UFormField>
                    </div>
                </div>
                <div v-else-if="step?.id === 'step2'">
                    <div class="flex flex-col gap-4">
                        <UFormField :label="$ts('can_see')" :error="errors.canSee?.message">
                            <USelectMenu v-model="configurationState.canSee" :placeholder="$ts('can_see')"
                                :items="canSeeAndRegisterOptions" label-key="label" value-key="value"
                                :size="responsiveUISizes.input" />
                        </UFormField>
                        <UFormField :label="$ts('can_see_registered')" :error="errors.canSeeRegistered?.message">
                            <USelectMenu v-model="configurationState.canSeeRegistered"
                                :placeholder="$ts('can_see_registered')" :items="canSeeAndRegisterOptions"
                                label-key="label" value-key="value" :size="responsiveUISizes.input" />
                        </UFormField>
                        <UFormField :label="$ts('enable_subscription')">
                            <USwitch v-model="state.enableSubscription" :placeholder="$ts('enable_subscription')"
                                :size="responsiveUISizes.input" />
                        </UFormField>
                        <UFormField :label="$ts('only_participant_can_visit')"
                            :error="errors.onlyParticipantCanVisit?.message">
                            <USwitch v-model="configurationState.onlyParticipantCanVisit"
                                :placeholder="$ts('only_participant_can_visit')" :size="responsiveUISizes.input" />
                        </UFormField>
                        <UFormField :label="$ts('message_after_registration')"
                            :error="errors.messageAfterRegister?.message">
                            <CoreTiptap v-model="(configurationState.messageAfterRegister as string)"
                                :placeholder="$ts('message_after_registration')" />
                        </UFormField>
                        <div class="grid gap-2 grid-cols-2">
                            <div class="space-y-2">
                                <USeparator class="my-2" :label="$ts('committee')" />
                                <UFormField :label="$ts('pay')">
                                    <div class="flex flex-row gap-2 items-center">
                                        <USwitch v-model="configurationState.committee.pay" :placeholder="$ts('pay')" />
                                        <UInputNumber v-model="configurationState.committee.amount" :format-options="{
                                            style: 'currency',
                                            currency: 'IDR',
                                            currencyDisplay: 'code',
                                            currencySign: 'accounting'
                                        }" :placeholder="$ts('amount')" :disabled="!configurationState.committee.pay"
                                            orientation="vertical" :size="responsiveUISizes.input" />
                                    </div>
                                </UFormField>
                                <UFormField :label="$ts('can_register')" :error="errors.canRegister?.message">
                                    <USelectMenu v-model="configurationState.committee.canRegister"
                                        :placeholder="$ts('can_register')" :items="canSeeAndRegisterOptionsWithNone"
                                        label-key="label" value-key="value" :size="responsiveUISizes.input" />
                                </UFormField>
                                <UFormField :label="$ts('can_register_period')"
                                    :error="errors.canRegisterUntil?.message">
                                    <RangeDatePicker v-model="configurationState.committee.canRegisterUntil"
                                        :max="new Date(state.date.start)" />
                                </UFormField>
                                <UFormField :label="$ts('enable_form')">
                                    <USwitch v-model="enableFormCommittee" :placeholder="$ts('enable_form')" />
                                </UFormField>
                                <UFormField :label="$ts('point')" :error="errors.point?.message">
                                    <UInput v-model="configurationState.committee.point" :placeholder="$ts('point')"
                                        type="number" :size="responsiveUISizes.input" />
                                </UFormField>
                                <UFormField :label="$ts('reqruitment')" :error="errors.reqruitments?.message">
                                    <UButton icon="i-heroicons-plus" color="neutral" variant="subtle"
                                        @click="addNewReqruitmentCommittee()" block class="mb-2"
                                        :size="responsiveUISizes.button" />
                                    <UCollapsible
                                        v-for="(reqruitment, index) in configurationState.committee.reqruitments"
                                        :key="index" v-if="configurationState.committee.reqruitments" class="w-full">
                                        <div class="flex flex-row gap-2 items-center w-full mb-2">
                                            <UButton :label="`${reqruitment.label}`" color="neutral" variant="outline"
                                                trailing-icon="i-lucide-chevron-down" block
                                                :size="responsiveUISizes.button" />
                                            <UButton icon="i-heroicons-pencil" color="neutral" variant="outline"
                                                @click="editReqruitmentCommittee(reqruitment, index)"
                                                :size="responsiveUISizes.button" />
                                            <UButton icon="i-heroicons-trash" color="neutral" variant="outline"
                                                @click="deleteReqruitmentCommittee(index)"
                                                :size="responsiveUISizes.button" />
                                        </div>
                                        <template #content>
                                            <div class="p-2">
                                                <h1 class="text-lg font-semibold mb-2">{{ $ts('description') }}</h1>
                                                {{ reqruitment.description }}
                                            </div>
                                        </template>
                                    </UCollapsible>
                                </UFormField>
                                <UFormField :label="$ts('job_available')" :error="errors.jobAvailables?.message">
                                    <UButton icon="i-heroicons-plus" color="neutral" variant="subtle"
                                        @click="addNewJob()" block class="mb-2" :size="responsiveUISizes.button" />
                                    <UCollapsible v-for="(job, index) in configurationState.committee.jobAvailables"
                                        :key="index" v-if="configurationState.committee.jobAvailables">
                                        <div class="flex flex-row gap-2 items-center w-full mb-2">
                                            <UButton :label="`${job.label}`" color="neutral" variant="outline"
                                                trailing-icon="i-lucide-chevron-down" block
                                                :size="responsiveUISizes.button" />
                                            <UButton icon="i-heroicons-pencil" color="neutral" variant="outline"
                                                @click="editJob(job, index)" :size="responsiveUISizes.button" />
                                            <UButton icon="i-heroicons-trash" color="neutral" variant="outline"
                                                @click="deleteJob(index)" :size="responsiveUISizes.button" />
                                        </div>
                                        <template #content>
                                            <div class="p-2">
                                                <h1 class="text-lg font-semibold mb-2">{{ $ts('count') }}</h1>
                                                {{ job.count }}
                                            </div>
                                        </template>
                                    </UCollapsible>
                                </UFormField>
                            </div>
                            <div class="space-y-2">
                                <USeparator class="my-2" :label="$ts('participant')" />
                                <UFormField :label="$ts('pay')">
                                    <div class="flex flex-row gap-2 items-center">
                                        <USwitch v-model="configurationState.participant.pay" :placeholder="$ts('pay')"
                                            :size="responsiveUISizes.input" />
                                        <UInputNumber v-model="configurationState.participant.amount" :format-options="{
                                            style: 'currency',
                                            currency: 'IDR',
                                            currencyDisplay: 'code',
                                            currencySign: 'accounting'
                                        }" :placeholder="$ts('amount')" :disabled="!configurationState.participant.pay"
                                            orientation="vertical" :size="responsiveUISizes.input" />
                                    </div>
                                </UFormField>
                                <UFormField :label="$ts('can_register')" :error="errors.canRegister?.message">
                                    <USelectMenu v-model="configurationState.participant.canRegister"
                                        :placeholder="$ts('can_register')" :items="canSeeAndRegisterOptions"
                                        label-key="label" value-key="value" :size="responsiveUISizes.input" />
                                </UFormField>
                                <UFormField :label="$ts('can_register_period')"
                                    :error="errors.canRegisterUntil?.message">
                                    <RangeDatePicker v-model="configurationState.participant.canRegisterUntil"
                                        :max="new Date(state.date.start)" />
                                </UFormField>
                                <UFormField :label="$ts('enable_form')">
                                    <USwitch v-model="enableFormParticipant" :placeholder="$ts('enable_form')"
                                        :size="responsiveUISizes.input" />
                                </UFormField>
                                <UFormField :label="$ts('point')" :error="errors.point?.message">
                                    <UInput v-model="configurationState.participant.point" :placeholder="$ts('point')"
                                        type="number" :size="responsiveUISizes.input" />
                                </UFormField>
                                <UFormField :label="$ts('reqruitment')" :error="errors.reqruitments?.message">
                                    <UButton icon="i-heroicons-plus" color="neutral" variant="subtle"
                                        @click="addNewReqruitmentParticipant()" block class="mb-2"
                                        :size="responsiveUISizes.button" />
                                    <UCollapsible
                                        v-for="(reqruitment, index) in configurationState.participant.reqruitments"
                                        :key="index" v-if="configurationState.participant.reqruitments">
                                        <div class="flex flex-row gap-2 items-center w-full mb-2">
                                            <UButton :label="`${reqruitment.label}`" color="neutral" variant="outline"
                                                trailing-icon="i-lucide-chevron-down" block
                                                :size="responsiveUISizes.button" />
                                            <UButton icon="i-heroicons-pencil" color="neutral" variant="outline"
                                                @click="editReqruitmentParticipant(reqruitment, index)"
                                                :size="responsiveUISizes.button" />
                                            <UButton icon="i-heroicons-trash" color="neutral" variant="outline"
                                                @click="deleteReqruitmentParticipant(index)"
                                                :size="responsiveUISizes.button" />
                                        </div>
                                        <template #content>
                                            <div class="p-2">
                                                <h1 class="text-lg font-semibold mb-2">{{ $ts('description') }}</h1>
                                                {{ reqruitment.description }}
                                            </div>
                                        </template>
                                    </UCollapsible>
                                </UFormField>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else-if="step?.id === 'step3'">
                    <div class="p-2 space-y-2">
                        <div class="flex flex-row justify-between items-center mb-2 w-full gap-2"
                            v-for="(committee, key) in committeesState" :key="key">
                            <UFormField :label="$ts('committee')" :error="errors[key]?.message" class="basis-1/3">
                                <USelectMenu :items="jobsCommittee" icon="i-lucide-user" :placeholder="$ts('search')"
                                    v-model="(committeesState[key]!.job)" class="w-full" value-key="label"
                                    label-key="label" :size="responsiveUISizes.input">
                                </USelectMenu>
                            </UFormField>
                            <UFormField :label="$ts('member')" :error="errors[key]?.message" class="w-full">
                                <USelectMenu :items="members" :loading="memberstatus === 'pending'"
                                    v-model:search-term="memberSearchTerm" :filter-fields="['label', 'email']"
                                    icon="i-lucide-user" :placeholder="$ts('search')"
                                    v-model="(committeesState[key]!.member as number)" value-key="value" class="w-full"
                                    :size="responsiveUISizes.input">
                                    <template #item-label="{ item }">
                                        {{ item.label }}
                                        <span class="text-(--ui-text-muted)">
                                            {{ item.value }}
                                        </span>
                                    </template>
                                </USelectMenu>
                            </UFormField>
                            <UButton icon="i-heroicons-trash" color="error" variant="soft"
                                @click="removeCommittee(Number(key))" class="mt-4" />
                        </div>
                        <UButton icon="i-heroicons-plus" color="neutral" variant="subtle" @click="addCommittee()" block
                            class="mb-2" :size="responsiveUISizes.button">
                            {{ $ts('add_committee') }}
                        </UButton>
                        <UFormField :label="$ts('job_available')" :error="errors.jobAvailables?.message">
                            <UButton icon="i-heroicons-plus" color="neutral" variant="subtle" @click="addNewJob()" block
                                class="mb-2" :size="responsiveUISizes.button" />
                            <UCollapsible v-for="(job, index) in configurationState.committee.jobAvailables"
                                :key="index" v-if="configurationState.committee.jobAvailables">
                                <div class="flex flex-row gap-2 items-center w-full mb-2">
                                    <UButton :label="`${job.label}`" color="neutral" variant="outline"
                                        trailing-icon="i-lucide-chevron-down" block :size="responsiveUISizes.button" />
                                    <UButton icon="i-heroicons-pencil" color="neutral" variant="outline"
                                        @click="editJob(job, index)" :size="responsiveUISizes.button" />
                                    <UButton icon="i-heroicons-trash" color="neutral" variant="outline"
                                        @click="deleteJob(index)" :size="responsiveUISizes.button" />
                                </div>
                                <template #content>
                                    <div class="p-2">
                                        <h1 class="text-lg font-semibold mb-2">{{ $ts('count') }}</h1>
                                        {{ job.count }}
                                    </div>
                                </template>
                            </UCollapsible>
                        </UFormField>
                    </div>
                </div>
                <div v-else-if="step?.id === 'step4'">
                    <div class="p-2 space-y-2">
                        <div class="flex flex-row justify-between items-center mb-2 w-full">
                            <h1 class="text-lg font-semibold mb-2">{{ state.title }}</h1>
                            <UBadge :label="categoryOptions.find(cat => cat.value === state.category as string)?.label"
                                class="text-sm" />
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <UFormField :label="$ts('tags')" :error="errors.tags?.message">
                                <USelectMenu v-model="state.tags" :placeholder="$ts('tags')" :items="tagsData" multiple
                                    class="w-full" create-item @create="addNewTag" disabled
                                    :size="responsiveUISizes.input" />
                            </UFormField>
                            <UFormField :label="`${$ts('date')} & ${$ts('time')}`" name="date" id="date"
                                :class="[isMobile ? 'col-span-full' : 'col-span-2']" required>
                                <UPopover :popper="{ placement: 'bottom-start', strategy: 'absolute' }">
                                    <UButton icon="i-heroicons-calendar-days-20-solid" :size="responsiveUISizes.button"
                                        color="neutral" variant="outline" class="w-full" disabled>
                                        {{ format(state.date.start as Date, 'd MMM, yyy') }} -
                                        {{ format(state.date.end as Date, 'd MMM, yyy') }}
                                    </UButton>
                                    <template #content>
                                        <div class="flex items-center divide-gray-200 sm:divide-x dark:divide-gray-800">
                                            <RangeDatePicker v-model="state.date" :min="new Date()" />
                                        </div>
                                    </template>
                                </UPopover>
                            </UFormField>
                            <UFormField :label="$ts('location')" :error="errors.at?.message">
                                <UInput v-model="state.at" :placeholder="$ts('location')" disabled />
                            </UFormField>
                            <UFormField :label="$ts('location_link')" :error="errors.atLink?.message">
                                <UInput v-model="state.atLink" :placeholder="$ts('location_link')" disabled
                                    :size="responsiveUISizes.input" />
                            </UFormField>
                            <UFormField :label="$ts('description')" :error="errors.description?.message"
                                class="col-span-full">
                                <CoreTiptap v-model="state.description" :placeholder="$ts('description')" disabled />
                            </UFormField>
                        </div>
                        <USeparator class="my-2" :label="$ts('configuration')" />

                        <div class="grid grid-cols-2 gap-2">
                            <UFormField :label="$ts('can_see')" :error="errors.canSee?.message">
                                <USelectMenu v-model="configurationState.canSee" :placeholder="$ts('can_see')"
                                    :items="canSeeAndRegisterOptions" label-key="label" value-key="value" disabled
                                    :size="responsiveUISizes.input" />
                            </UFormField>
                            <UFormField :label="$ts('can_see_registered')" :error="errors.canSeeRegistered?.message">
                                <USelectMenu v-model="configurationState.canSeeRegistered"
                                    :placeholder="$ts('can_see_registered')" :items="canSeeAndRegisterOptions"
                                    label-key="label" value-key="value" disabled :size="responsiveUISizes.input" />
                            </UFormField>
                            <UFormField :label="$ts('enable_subscription')">
                                <USwitch v-model="state.enableSubscription" :placeholder="$ts('enable_subscription')"
                                    disabled :size="responsiveUISizes.input" />
                            </UFormField>
                            <UFormField :label="$ts('only_participant_can_visit')"
                                :error="errors.onlyParticipantCanVisit?.message">
                                <USwitch v-model="configurationState.onlyParticipantCanVisit"
                                    :placeholder="$ts('only_participant_can_visit')" disabled
                                    :size="responsiveUISizes.input" />
                            </UFormField>
                            <UFormField :label="$ts('message_after_registration')"
                                :error="errors.messageAfterRegister?.message" class="col-span-full">
                                <CoreTiptap v-model="(configurationState.messageAfterRegister as string)"
                                    :placeholder="$ts('message_after_registration')" disabled />
                            </UFormField>
                        </div>

                        <div class="grid gap-4 grid-cols-2">
                            <div class="space-y-2">
                                <USeparator class="my-2" :label="$ts('committee')" />
                                <UFormField :label="$ts('pay')">
                                    <div class="flex flex-row gap-2 items-center">
                                        <USwitch v-model="configurationState.committee.pay" :placeholder="$ts('pay')"
                                            disabled :size="responsiveUISizes.input" />
                                        <UInputNumber v-model="configurationState.committee.amount" :format-options="{
                                            style: 'currency',
                                            currency: 'IDR',
                                            currencyDisplay: 'code',
                                            currencySign: 'accounting'
                                        }" :placeholder="$ts('amount')" disabled orientation="vertical"
                                            :size="responsiveUISizes.input" />
                                    </div>
                                </UFormField>
                                <UFormField :label="$ts('can_register')" :error="errors.canRegister?.message">
                                    <USelectMenu v-model="configurationState.committee.canRegister"
                                        :placeholder="$ts('can_register')" :items="canSeeAndRegisterOptions"
                                        label-key="label" value-key="value" disabled :size="responsiveUISizes.input" />
                                </UFormField>
                                <UFormField :label="$ts('can_register_period')"
                                    :error="errors.canRegisterUntil?.message">
                                    <UPopover :popper="{ placement: 'bottom-start', strategy: 'absolute' }">
                                        <UButton icon="i-heroicons-calendar-days-20-solid"
                                            :size="responsiveUISizes.button" color="neutral" variant="outline"
                                            class="w-full" disabled>
                                            {{
                                                format(configurationState.committee.canRegisterUntil.start as Date,
                                                    'd MMM, yyy')
                                            }} -
                                            {{
                                                format(configurationState.committee.canRegisterUntil.end as Date,
                                                    'd MMM, yyy')
                                            }}
                                        </UButton>
                                        <template #content>
                                            <div
                                                class="flex items-center divide-gray-200 sm:divide-x dark:divide-gray-800">
                                                <RangeDatePicker v-model="configurationState.committee.canRegisterUntil"
                                                    :max="new Date(state.date.start)" />
                                            </div>
                                        </template>
                                    </UPopover>
                                </UFormField>
                                <UFormField :label="$ts('point')" :error="errors.point?.message">
                                    <UInput v-model="configurationState.committee.point" :placeholder="$ts('point')"
                                        type="number" disabled :size="responsiveUISizes.input" />
                                </UFormField>
                                <UFormField :label="$ts('enable_form')">
                                    <USwitch v-model="enableFormCommittee" :size="responsiveUISizes.input" />
                                </UFormField>
                                <UFormField :label="$ts('reqruitment')" :error="errors.reqruitments?.message">
                                    <UCollapsible
                                        v-for="(reqruitment, index) in configurationState.committee.reqruitments"
                                        :key="index" v-if="configurationState.committee.reqruitments" class="w-full">
                                        <div class="flex flex-row gap-2 items-center w-full mb-2">
                                            <UButton :label="`${reqruitment.label}`" color="neutral" variant="outline"
                                                trailing-icon="i-lucide-chevron-down" block
                                                :size="responsiveUISizes.button" />
                                        </div>
                                        <template #content>
                                            <div class="p-2">
                                                <h1 class="text-lg font-semibold mb-2">{{ $ts('description') }}</h1>
                                                <p>{{ reqruitment.description }}</p>
                                            </div>
                                        </template>
                                    </UCollapsible>
                                </UFormField>
                                <UFormField :label="$ts('job_available')" :error="errors.jobAvailables?.message">
                                    <UCollapsible v-for="(job, index) in configurationState.committee.jobAvailables"
                                        :key="index" v-if="configurationState.committee.jobAvailables">
                                        <div class="flex flex-row gap-2 items-center w-full mb-2">
                                            <UButton :label="`${job.label}`" color="neutral" variant="outline"
                                                trailing-icon="i-lucide-chevron-down" block
                                                :size="responsiveUISizes.button" />
                                        </div>
                                        <template #content>
                                            <div class="p-2">
                                                <h1 class="text-lg font-semibold mb-2">{{ $ts('count') }}</h1>
                                                <p>{{ job.count }}</p>
                                            </div>
                                        </template>
                                    </UCollapsible>
                                </UFormField>
                            </div>
                            <div class="space-y-2">
                                <USeparator class="my-2" :label="$ts('participant')" />
                                <UFormField :label="$ts('pay')">
                                    <div class="flex flex-row gap-2 items-center">
                                        <USwitch v-model="configurationState.participant.pay" :placeholder="$ts('pay')"
                                            disabled :size="responsiveUISizes.input" />
                                        <UInputNumber v-model="configurationState.participant.amount" :format-options="{
                                            style: 'currency',
                                            currency: 'IDR',
                                            currencyDisplay: 'code',
                                            currencySign: 'accounting'
                                        }" :placeholder="$ts('amount')" disabled orientation="vertical"
                                            :size="responsiveUISizes.input" />
                                    </div>
                                </UFormField>
                                <UFormField :label="$ts('can_register')" :error="errors.canRegister?.message">
                                    <USelectMenu v-model="configurationState.participant.canRegister"
                                        :placeholder="$ts('can_register')" :items="canSeeAndRegisterOptions"
                                        label-key="label" value-key="value" disabled :size="responsiveUISizes.input" />
                                </UFormField>
                                <UFormField :label="$ts('can_register_period')"
                                    :error="errors.canRegisterUntil?.message">
                                    <UPopover :popper="{ placement: 'bottom-start', strategy: 'absolute' }">
                                        <UButton icon="i-heroicons-calendar-days-20-solid"
                                            :size="responsiveUISizes.button" color="neutral" variant="outline"
                                            class="w-full" disabled>
                                            {{
                                                format(configurationState.participant.canRegisterUntil.start as Date,
                                                    'd MMM, yyy')
                                            }} -
                                            {{
                                                format(configurationState.participant.canRegisterUntil.end as Date,
                                                    'd MMM, yyy')
                                            }}
                                        </UButton>
                                        <template #content>
                                            <div
                                                class="flex items-center divide-gray-200 sm:divide-x dark:divide-gray-800">
                                                <RangeDatePicker
                                                    v-model="configurationState.participant.canRegisterUntil"
                                                    :max="new Date(state.date.start)" />
                                            </div>
                                        </template>
                                    </UPopover>
                                </UFormField>
                                <UFormField :label="$ts('point')" :error="errors.point?.message">
                                    <UInput v-model="configurationState.participant.point" :placeholder="$ts('point')"
                                        type="number" disabled :size="responsiveUISizes.input" />
                                </UFormField>
                                <UFormField :label="$ts('enable_form')">
                                    <USwitch v-model="enableFormParticipant" :size="responsiveUISizes.input" />
                                </UFormField>
                                <UFormField :label="$ts('reqruitment')" :error="errors.reqruitments?.message">
                                    <UCollapsible
                                        v-for="(reqruitment, index) in configurationState.participant.reqruitments"
                                        :key="index" v-if="configurationState.participant.reqruitments">
                                        <div class="flex flex-row gap-2 items-center w-full mb-2">
                                            <UButton :label="`${reqruitment.label}`" color="neutral" variant="outline"
                                                trailing-icon="i-lucide-chevron-down" block
                                                :size="responsiveUISizes.button" />
                                        </div>
                                        <template #content>
                                            <div class="p-2">
                                                <h1 class="text-lg font-semibold mb-2">{{ $ts('description') }}</h1>
                                                <p>{{ reqruitment.description }}</p>
                                            </div>
                                        </template>
                                    </UCollapsible>
                                </UFormField>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </CoreStepper>
    </div>
</template>
