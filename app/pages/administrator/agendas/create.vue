<script setup lang="ts">
import { CoreStepper, ModalsActions, ModalsCategoryAdd, ModalsConfirmation, ModalsJobAdd, ModalsJobEdit, ModalsReqruitmentAdd, ModalsReqruitmentEdit } from '#components';
import type { ButtonProps } from '@nuxt/ui';
import { format } from 'date-fns';
import type { IAgenda, IAgendaConfiguration, ICommittee, IJob, IReqruitment } from '~~/types';
import type { FieldValidationRules, Step } from '~~/types/component/stepper';
import type { IReqAgenda } from '~~/types/IRequestPost';
import type { ICategoriesResponse, IMemberResponse, IResponse, ITagsResponse } from '~~/types/IResponse';
definePageMeta({
    middleware: ['sidebase-auth', 'organizer'],
    layout: 'dashboard',
});
const router = useRouter();
const overlay = useOverlay();
const toast = useToast();
const { $api } = useNuxtApp();
const { $ts } = useI18n();
const config = useRuntimeConfig();

const AddCategoryModal = overlay.create(ModalsCategoryAdd);
const AddJobModal = overlay.create(ModalsJobAdd);
const AddReqruitmentModal = overlay.create(ModalsReqruitmentAdd);
const EditJobModal = overlay.create(ModalsJobEdit);
const EditReqruitmentModal = overlay.create(ModalsReqruitmentEdit);
const ConfirmationModal = overlay.create(ModalsConfirmation);
const ActionsModal = overlay.create(ModalsActions);


/**
 * Responsive design setup
 */
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);

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
const tagsItemsRef = ref<string[]>([]);
const tagsItems = computed({
    get: () => {
        return tagsItemsRef.value;
    },
    set: (value) => {
        tagsItemsRef.value = value;
    }
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
const { data: members, status: memberstatus } = useAsyncData(() => $api<IMemberResponse>("/api/member", {
    method: 'GET',
    params: {
        search: memberSearchTerm.value,
        page: 0,
        perPage: 10
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
const enableFormCommittee = ref(false);
const enableFormParticipant = ref(false);
const configurationState = reactiveComputed<IAgendaConfiguration>(() => {
    return {
        canSee: "Public",
        canSeeRegistered: "Public",
        onlyParticipantCanVisit: false,
        messageAfterRegister: '',
        committee: {
            pay: false,
            amount: 0,
            point: 0,
            reqruitments: [
            ],
            jobAvailables: [
            ],
            canRegister: "None",
            canRegisterUntil: {
                start: new Date(),
                end: new Date(),
            },
        },
        participant: {
            pay: false,
            amount: 0,
            point: 0,
            reqruitments: [
            ],
            canRegister: "Public",
            canRegisterUntil: {
                start: new Date(),
                end: new Date(),
            },
        }
    };
});
type ICommitteeState = {
    [key: number]: ICommittee;
};
const jobsCommitteesRef = ref<{ label: string }[]>([
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
const jobsCommittee = computed({
    get: () => {
        return jobsCommitteesRef.value;
    },
    set: (value) => {
        jobsCommitteesRef.value = value;
    }
});
const addJobCommittee = (newJob: string) => {
    jobsCommitteesRef.value.push({ label: newJob });
}
const committeesStateRef = ref<ICommitteeState>({
    1: {
        job: 'PIC/Penanggung Jawab',
        member: 0,
        approved: true,
        approvedAt: new Date(),
    },
});
const committeesState = reactiveComputed<ICommitteeState>(() => {
    return committeesStateRef.value;
});
const state = reactiveComputed<IReqAgenda>(() => {
    return {
        title: '',
        category: '',
        tags: [],
        description: '',
        at: '',
        atLink: '',
        date: {
            start: new Date(),
            end: new Date(),
        },
        registerLink: '',
        enableSubscription: false,
        enableForm: false,
        configuration: configurationState,
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
        // rules[key] = (value) => {
        //     return null;
        // };
        rules[key] = (value) => {
            if (!value) {
                return { path: key, message: $ts('member_required') };
            }
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
        onNext: saveStep1,

    },
    {
        id: 'step2',
        label: $ts('configuration'),
        title: $ts('configuration'),
        description: $ts('agenda_configuration_description'),
        formData: configurationState,
        validationRules: configurationStateRules,
        onNext: saveStep2,
    },
    {
        id: 'step3',
        label: $ts('committee'),
        title: $ts('committee'),
        description: $ts('committee_description'),
        formData: committeesState,
        validationRules: committeesStateRules,
        onNext: saveStep3,
    },
    {
        id: 'step4',
        label: $ts('review_your_agenda'),
        title: $ts('review_your_agenda'),
        description: $ts('review_your_agenda_description'),
        formData: {},
        onNext: onSubmit,
    }
])
const route = useRoute();
const tab = ref(0);
const agendaId = ref<string | null>(route.query.id as string || null);

// Update URL when agendaId changes
watch(agendaId, (newId) => {
    if (newId) {
        router.replace({ query: { ...route.query, id: newId } });
    }
});

// Initialize form data if ID exists in query
const initFromQuery = async () => {
    if (!agendaId.value) return;

    loading.value = true;
    try {
        const { data } = await $api<IResponse & { data: { agenda: IAgenda } }>(`/api/agenda/${agendaId.value}`);
        if (data && data.agenda) {
            const agenda = data.agenda;

            // Map basic state
            state.title = agenda.title;
            // Handle category which can be string or object
            if (agenda.category) {
                if (typeof agenda.category === 'object' && '_id' in agenda.category) {
                    state.category = (agenda.category as any)._id;
                } else {
                    state.category = agenda.category as string;
                }
            }
            state.tags = agenda.tags || [];
            state.description = agenda.description;
            state.at = agenda.at;
            state.atLink = agenda.atLink;
            state.date = {
                start: new Date(agenda.date.start),
                end: new Date(agenda.date.end),
            };
            // state.registerLink = agenda.registerLink;
            // state.enableSubscription = !!agenda.enableSubscription;
            // state.enableForm = !!agenda.enableForm;

            // Map configuration
            Object.assign(configurationState, agenda.configuration);
            // Ensure dates are Date objects for configuration
            if (configurationState.committee?.canRegisterUntil) {
                configurationState.committee.canRegisterUntil.start = new Date(configurationState.committee.canRegisterUntil.start);
                configurationState.committee.canRegisterUntil.end = new Date(configurationState.committee.canRegisterUntil.end);
            }
            if (configurationState.participant?.canRegisterUntil) {
                configurationState.participant.canRegisterUntil.start = new Date(configurationState.participant.canRegisterUntil.start);
                configurationState.participant.canRegisterUntil.end = new Date(configurationState.participant.canRegisterUntil.end);
            }

            // Map committees
            if (agenda.committees && agenda.committees.length > 0) {
                const newCommitteesState: ICommitteeState = {};
                agenda.committees.forEach((c, index) => {
                    // 1-based index for UI consistency if needed, or just use array index + 1
                    newCommitteesState[index + 1] = {
                        ...c,
                        member: typeof c.member === 'object' ? (c.member as any).NIM : c.member, // UI expects NIM for select menu value
                    };
                });
                committeesStateRef.value = newCommitteesState;
            }
        }
    } catch (error) {
        toast.add({ title: $ts('failed_to_load_draft'), color: 'error' });
        console.error("Failed to load draft", error);
    } finally {
        loading.value = false;
    }
};

// Call init on mount
onMounted(() => {
    initFromQuery();
});

async function saveStep1() {
    loading.value = true;
    try {
        const body = {
            ...state,
            isDraft: true,
        };
        if (agendaId.value) {
            const response = await $api<IResponse & { data?: string }>(`api/agenda`, {
                method: 'PUT',
                params: { id: agendaId.value },
                body: body,
            });
            if (response.statusCode === 200) {
                // Keep agendaId as it is
            }
        } else {
            const response = await $api<IResponse & { data?: string }>('api/agenda', {
                method: 'POST',
                body: body,
            });
            if (response.statusCode === 200 && response.data) {
                agendaId.value = response.data;
                // Update URL without reloading to allow refresh persistence if needed (optional)
                // router.replace({ query: { ...route.query, id: response.data } }) // logic can be added later
            }
        }
    } catch (err: any) {
        if (err.response) {
            toast.add({ title: err.response.data.message, color: 'error' });
        } else {
            toast.add({ title: $ts('something_went_wrong'), color: 'error' });
        }
        throw err; // Stop stepper
    } finally {
        loading.value = false;
    }
}

async function saveStep2() {
    if (!agendaId.value) return;
    loading.value = true;
    try {
        const response = await $api<IResponse & { data?: string }>(`api/agenda`, {
            method: 'PUT',
            params: { id: agendaId.value },
            body: {
                ...state,
                configuration: configurationState,
                isDraft: true,
            },
        });
    } catch (err: any) {
        if (err.response) {
            toast.add({ title: err.response.data.message, color: 'error' });
        } else {
            toast.add({ title: $ts('something_went_wrong'), color: 'error' });
        }
        throw err;
    } finally {
        loading.value = false;
    }
}

async function saveStep3() {
    if (!agendaId.value) return;
    loading.value = true;
    try {
        const response = await $api<IResponse & { data?: string }>(`api/agenda`, {
            method: 'PUT',
            params: { id: agendaId.value },
            body: {
                ...state,
                configuration: configurationState,
                committees: Object.values(committeesState).map((committee) => ({
                    ...committee,
                    member: committee.member as number,
                })),
                isDraft: true,
            },
        });
    } catch (err: any) {
        if (err.response) {
            toast.add({ title: err.response.data.message, color: 'error' });
        } else {
            toast.add({ title: $ts('something_went_wrong'), color: 'error' });
        }
        throw err;
    } finally {
        loading.value = false;
    }
}

async function onSubmit() {
    if (!agendaId.value) return; // Should not happen if step 1 passed
    loading.value = true;
    try {
        const response = await $api<IResponse & { data?: string }>(`api/agenda`, {
            method: 'PUT',
            params: { id: agendaId.value },
            body: {
                ...state,
                configuration: configurationState,
                committees: Object.values(committeesState).map((committee) => ({
                    ...committee,
                    member: committee.member as number,
                })),
                isPublish: true, // Trigger notifications
                enableSubscription: state.enableSubscription,
            },
        });
        if (response.statusCode === 200 && response.data) {
            toast.add({
                title: $ts('success'), description: $ts('success_to_add_agenda', {
                    title: state.title,
                    date: format(new Date(), 'd MMM yyy')
                }), color: 'success'
            });
            const actions: ButtonProps[] = [
                {
                    label: $ts('open'),
                    color: 'primary',
                    variant: 'outline',
                    to: `/administrator/agendas/${response.data}`,
                    icon: 'i-heroicons-calendar-check'
                },
                {
                    label: $ts('close'),
                    color: 'error',
                    variant: 'ghost',
                    onClick: () => {
                        ActionsModal.close();
                    }
                }
            ];
            if (enableFormCommittee.value) {
                actions.unshift({
                    label: 'Form Panita',
                    color: 'primary',
                    variant: 'outline',
                    to: `/administrator/agendas/${response.data}/committee/form`,
                    icon: 'i-heroicons-document-text',
                    target: '_blank',
                    class: 'flex-1'
                })
            }
            if (enableFormParticipant.value) {
                actions.unshift({
                    label: 'Form Peserta',
                    color: 'primary',
                    variant: 'outline',
                    to: `/administrator/agendas/${response.data}/participant/form`,
                    icon: 'i-heroicons-document-text',
                    target: '_blank',
                    class: 'flex-1'
                })
            }
            ActionsModal.open({
                title: $ts('success'),
                body: $ts('success_to_add_agenda', {
                    title: state.title,
                    date: format(new Date(), 'd MMM yyy')
                }),
                actions: actions
            });
        } else {
            toast.add({
                title: $ts('failed'), description: $ts('failed_to_add_agenda', {
                    title: state.title,
                    date: format(new Date(), 'd MMM yyy')
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

const addCommittee = () => {
    const newIndex = Object.keys(committeesState).length + 1;
    committeesStateRef.value = {
        ...committeesState,
        [newIndex]: {
            job: '',
            member: 0,
            approved: true,
            approvedAt: new Date(),
        }
    };
};
const removeCommittee = (index: number) => {
    delete committeesState[index];
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
    tagsItemsRef.value.push(tag);
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
                toast.add({
                    title: $ts('job_available_already_exists', {
                        job: jobAvailable.label
                    }), color: 'error'
                });
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
                toast.add({
                    title: $ts('reqruitment_already_exists', {
                        req: reqruitmentAvailable.label
                    }), color: 'error'
                });
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
                toast.add({
                    title: $ts('reqruitment_already_exists', {
                        req: reqruitmentAvailable.label
                    }), color: 'error'
                });
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
                toast.add({
                    title: $ts('job_available_not_found', {
                        job: jobAvailable.label
                    }), color: 'error'
                });
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
                toast.add({
                    title: $ts('reqruitment_not_found', {
                        req: reqruitmentAvailable.label
                    }), color: 'error'
                });
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
                toast.add({
                    title: $ts('reqruitment_not_found', {
                        req: reqruitmentAvailable.label
                    }), color: 'error'
                });
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
            job: configurationState.committee.jobAvailables![index]!.label
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
            req: configurationState.committee.reqruitments![index]!.label
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
            req: configurationState.participant.reqruitments![index]!.label
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


const links = [
    { label: $ts('dashboard'), to: '/dashboard', icon: 'i-heroicons-home' },
    { label: $ts('agenda'), to: '/dashboard/agendas', icon: 'i-heroicons-clipboard-document-list' },
    { label: $ts('add'), icon: 'i-heroicons-plus' },
];
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
                            <USelectMenu v-model="state.tags" :placeholder="$ts('tags')" :items="tagsItems" multiple
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
                            v-for="(committee, index) in committeesState" :key="index">
                            <UFormField :label="$ts('committee')" :error="errors[index]?.message" class="basis-1/3">
                                <USelectMenu :items="jobsCommittee" icon="i-lucide-user" :placeholder="$ts('search')"
                                    v-model="(committeesState[index]!.job)" class="w-full" value-key="label"
                                    :size="responsiveUISizes.input" create-item @create="addJobCommittee">
                                </USelectMenu>
                            </UFormField>
                            <UFormField :label="$ts('member')" :error="errors[index]?.message" class="w-full">
                                <USelectMenu :items="members" :loading="memberstatus === 'pending'"
                                    v-model:search-term="memberSearchTerm" :filter-fields="['label', 'email']"
                                    icon="i-lucide-user" :placeholder="$ts('search')"
                                    v-model="(committeesState[index]!.member as number)" value-key="value"
                                    class="w-full" :size="responsiveUISizes.input">
                                    <template #item-label="{ item }">
                                        {{ item.label }}
                                        <span class="text-(--ui-text-muted)">
                                            {{ item.value }}
                                        </span>
                                    </template>
                                </USelectMenu>
                            </UFormField>
                            <UButton icon="i-heroicons-trash" color="error" variant="soft"
                                @click="removeCommittee(Number(index))" class="mt-4" />
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
                                <RangeDatePicker v-model="state.date" :min="new Date()" />
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
                                    <RangeDatePicker v-model="configurationState.committee.canRegisterUntil"
                                        :max="new Date(state.date.start)" />
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
                                    <RangeDatePicker v-model="configurationState.participant.canRegisterUntil"
                                        :max="new Date(state.date.start)" />
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
