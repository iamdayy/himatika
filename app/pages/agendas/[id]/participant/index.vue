<script setup lang='ts'>
import { ModalsConfirmation, ModalsQrReader, NuxtImg, UCheckbox } from '#components';
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui';
import type { Row } from '@tanstack/vue-table';
import type { IAgenda, IGuest, IMember, IParticipant, IQuestion } from '~~/types';
import type { IAgendaParticipantResponse, IExportSheetResponse, IResponse } from '~~/types/IResponse';

definePageMeta({
    layout: 'client',
    auth: false
});


const UButton = resolveComponent('UButton');
const UBadge = resolveComponent('UBadge');
const UDropdownMenu = resolveComponent('UDropdownMenu');

/**
 * Current page number for pagination
 */
const table = useTemplateRef('table')
const pagination = ref({
    pageIndex: 1,
    pageSize: 5
})
/**
 * Number of items per page
 */
const route = useRoute();
const { $ts, $tn } = useI18n();
const { $api } = useNuxtApp()
const { data: user } = useAuth();
const overlay = useOverlay();

const ConfirmationModal = overlay.create(ModalsConfirmation);
const QRCodeModalComp = overlay.create(ModalsQrReader);



const id = route.params.id;
const search = ref('');
const { data, refresh, pending } = useLazyAsyncData<IAgendaParticipantResponse>('agenda-participant', () => $fetch(`/api/agenda/${id}/participant`, {
    method: 'GET',
    query: {
        page: pagination.value.pageIndex,
        perPage: pagination.value.pageSize,
        search: search.value,
    }
}), {
    watch: [() => pagination.value.pageIndex, () => pagination.value.pageSize, search],
});
const toast = useToast();
const { canMeRegister } = useCanMeRegister();
const agenda = computed<IAgenda | undefined>(() => data.value?.data?.agenda);
const { isCommittee, isRegistered, payStatus, registeredId, canMeUnregister } = useAgendas(agenda);

const selectedRows = ref<{
    [key: number]: boolean
}>({});
/**
 * Ref to store selected participant users
 */
const selectedParticipant = computed<IParticipant[]>(() => {
    return data.value?.data?.participants?.filter((_, index) => {
        return selectedRows.value[index] !== undefined && selectedRows.value[index] !== null;
    }) || [] as IParticipant[]
});


/**
 * Window size composable for responsive design
 */
const { width } = useWindowSize()

/**
 * Computed property to determine if the screen is mobile size
 */
const isMobile = computed(() => width.value < 640)
/**
 * Computed property for responsive table columns
 */
const { isOrganizer } = useOrganizer();
const columns = computed<TableColumn<IParticipant>[]>(() => {
    const baseColumns: TableColumn<IParticipant>[] = [
        {
            accessorKey: 'fullName',
            header: $ts('name'),
            size: 150,
            cell: ({ row }) => {
                return h('div', {
                    class: 'flex flex-row items-center gap-2',
                }, [
                    h(NuxtImg, {
                        provider: 'localProvider',
                        src: (row.original.member as IMember | undefined)?.avatar as string || '/img/profile-blank.png',
                        class: 'object-cover rounded-full max-w-12 aspect-square',
                    }),
                    h('div', {
                        class: 'flex flex-col items-start gap-1',
                    }, [
                        h('span', {
                            class: 'font-semibold text-gray-600 dark:text-gray-200'
                        }, row.original.member ? (row.original.member as IMember | undefined)?.fullName : (row.original.guest as IGuest).fullName),
                        h('span', {
                            class: 'text-sm font-light text-gray-600 dark:text-gray-300'
                        }, `${(row.original.member as IMember | undefined)?.NIM || (row.original.guest as IGuest | undefined)?.NIM || '-'} ${(isCommittee.value || isOrganizer.value) ? '| ' + ((row.original.member as IMember | undefined)?.email || (row.original.guest as IGuest | undefined)?.email || '-') : ''}`),
                    ]),
                ]);
            }
        },
        {
            accessorKey: 'class',
            header: $ts('class'),
            cell: ({ row }) => {
                return (row.original.member as IMember | undefined)?.class || (row.original.guest as IGuest | undefined)?.class || '-'
            }
        },
        {
            accessorKey: 'semester',
            header: $ts('semester'),
            cell: ({ row }) => {
                return (row.original.member as IMember | undefined)?.semester || (row.original.guest as IGuest | undefined)?.semester || '-'
            }
        },
        {
            accessorKey: 'association',
            header: $ts('association'),
            cell: ({ row }) => {
                return row.original.member ? 'Member' : 'Guest';
            }
        },
        {
            accessorKey: 'prodi',
            header: $ts('study_program'),
            cell: ({ row }) => {
                return (row.original.guest as IGuest | undefined)?.prodi || '-'
            }
        },
        {
            accessorKey: 'instution',
            header: $ts('instance'),
            cell: ({ row }) => {
                return (row.original.guest as IGuest | undefined)?.instance || '-'
            }
        }
    ];

    if (isCommittee.value || isOrganizer.value) {
        const committeeColumns: TableColumn<IParticipant>[] = [
            {
                id: 'expand',
                cell: ({ row }) =>
                    h(UButton, {
                        color: 'neutral',
                        variant: 'ghost',
                        icon: 'i-lucide-chevron-down',
                        square: true,
                        'aria-label': 'Expand',
                        disabled: !isCommittee.value,
                        size: responsiveUISizes.value.button,
                        ui: {
                            leadingIcon: [
                                'transition-transform',
                                row.getIsExpanded() ? 'duration-200 rotate-180' : ''
                            ]
                        },
                        onClick: () => row.toggleExpanded()
                    })
            },
            {
                id: 'select',
                header: ({ table }) =>
                    h(UCheckbox, {
                        modelValue: table.getIsSomePageRowsSelected()
                            ? 'indeterminate'
                            : table.getIsAllPageRowsSelected(),
                        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
                            table.toggleAllPageRowsSelected(!!value),
                        'aria-label': 'Select all'
                    }),
                cell: ({ row }) =>
                    h(UCheckbox, {
                        modelValue: row.getIsSelected(),
                        size: responsiveUISizes.value.input,
                        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
                        'aria-label': 'Select row'
                    })
            },
            {
                accessorKey: 'paid',
                header: $ts('payment_status'),
                cell: ({ row }) => {
                    return h(UBadge, {
                        color: row.original.payment?.status && row.original.payment?.status === 'success' ? 'success' : 'error',
                        label: row.original.payment?.status && agenda.value?.configuration.participant.pay ? row.original.payment?.status as string : $ts('not_paid')
                    })
                }
            },
            {
                accessorKey: 'visiting',
                header: $ts('visit_status'),
                cell: ({ row }) => {
                    return h(UBadge, {
                        color: row.original.visiting ? 'success' : 'error',
                        label: row.original.visiting ? $ts('visited') : $ts('not_visited')
                    })
                }
            },
            {
                id: 'actions',
                cell: ({ row }) => {
                    return h(
                        'div',
                        { class: 'text-right' },
                        h(
                            UDropdownMenu,
                            {
                                content: {
                                    align: 'end'
                                },
                                items: getRowItems(row)
                            },
                            () =>
                                h(UButton, {
                                    icon: 'i-lucide-ellipsis-vertical',
                                    color: 'neutral',
                                    variant: 'ghost',
                                    class: 'ml-auto'
                                })
                        )
                    )
                }
            }
        ];
        return [...baseColumns, ...committeeColumns];
    }

    return baseColumns;
});

function getRowItems(row: Row<IParticipant>): DropdownMenuItem[] {
    return [
        {
            type: 'label',
            label: $ts('action')
        },
        {
            icon: 'i-heroicons-check-circle',
            label: $ts('set_visit_status'),
            disabled: !user.value || row.original.visiting || !isCommittee.value,
            onSelect: () => openSetVisitedModal(row.original._id as string)
        },
        {
            icon: 'i-heroicons-banknotes',
            label: $ts('set_payment_status'),
            disabled: !user.value || row.original.payment?.status === 'success' || !isCommittee.value || agenda.value?.configuration.participant.pay === false,
            onSelect: () => setPaid(row.original._id as string)
        },
        {
            type: 'separator'
        },
        {
            icon: 'i-heroicons-trash',
            label: $ts('delete'),
            color: 'error',
            disabled: !isCommittee.value || row.original.payment?.status === 'success' || row.original.visiting,
            onSelect: () => deleteParticipant(row.original._id as string)
        }
    ]
}

const members = computed(() => data.value?.data?.participants || []);


/**
 * Generates and downloads an XLSX file of participant users
 */
const generateXlsx = async () => {
    try {
        const dataToExport = selectedParticipant.value.length > 0 ? selectedParticipant.value : members.value;
        if (!selectedParticipant.value.length && data.value?.data?.participants?.length === 0) {
            throw new Error('No data to export');
        }
        const headers = [
            { header: "Nama Lengkap", key: "fullName" },
            { header: "NIM", key: "NIM" },
            { header: "Email", key: "email" },
            { header: "Kelas", key: "class" },
            { header: "Program Studi", key: "prodi" },
            { header: "Semester", key: "semester" },
            { header: "Instansi", key: "instance" },
            { header: "Status Pembayaran", key: "status" },
            { header: "Hadir", key: "visiting" },
        ];
        if (agenda.value?.configuration.participant.questions) {
            (agenda.value?.configuration.participant.questions as IQuestion[]).forEach((question: IQuestion, index: number) => {
                headers.push({ header: question.question, key: question.question });
            });
        }
        const complexData = dataToExport.map((item: IParticipant) => {
            const answers: {
                [key: string]: string | number | boolean | null | undefined
            } = {};
            if (item.answers) {
                item.answers.forEach((answer) => {
                    answers[(answer.question as IQuestion).question] = answer.value;
                });
            }

            return {
                ...item,
                ...answers,
            }
        })
        const response = await $fetch<IExportSheetResponse>('/api/sheet/export', {
            method: "post",
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
            body: {
                title: "Participant-User",
                headers,
                data: complexData,
            }
        });
        if (!response.data) {
            throw new Error('No data returned');
        }
        const title = response.data?.title || 'Participant-User';
        const link = document.createElement('a');
        link.href = response.data?.url || '';
        link.setAttribute('download',
            `${title}-${new Date()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.add({
            title: 'Success',
            description: 'Exported successfully',
            color: 'success',
        })
    } catch (error: any) {
        toast.add({
            title: 'Error',
            description: error.message,
            color: 'error',
        })
    }
}

/**
 * Computed properties for pagination
 */
const pageTotal = computed(() => data.value?.data?.length || 0);
const pageFrom = computed(() => (pagination.value.pageIndex) * pagination.value.pageSize);
const pageTo = computed(() => Math.min((pagination.value.pageIndex + 1) * pagination.value.pageSize, pageTotal.value));
const perPageOptions = computed(() => {
    const filteredOptions = [5, 10, pageTotal.value, 20, 50, 100];
    if (isMobile.value && filteredOptions.length > 3) {
        return filteredOptions.slice(0, 3);
    }

    return filteredOptions;
});

const cancelRegister = async () => {
    ConfirmationModal.open({
        title: $ts('cancel_register'),
        body: $ts('cancel_register_desc'),
        onConfirm: async () => {
            if (!agenda.value) return;
            const response = await $api<IResponse>(`/api/agenda/${agenda.value._id}/participant/register/${registeredId()}`, {
                method: "DELETE"
            });
            if (response.statusCode === 200) {
                toast.add({ title: response.statusMessage });
                refresh();
            } else {
                toast.add({ title: "Failed to cancel register" });
            }
        }
    });
}

const deleteParticipant = async (participantId: string) => {
    ConfirmationModal.open({
        title: $ts('delete_participant'),
        body: $ts('delete_participant_confirmation'),
        onConfirm: async () => {
            try {
                const response = await $api<IResponse & { data: string }>(`/api/agenda/${id}/participant/register/${participantId}`, {
                    method: "DELETE",
                })
                toast.add({ title: $ts('success'), description: $ts('success_to_delete_participant') });
                refresh();
            } catch (error: any) {
                toast.add({ title: $ts('failed'), description: $ts('failed_to_delete_participant') });
            } finally {
                ConfirmationModal.close();
            }
        }
    });
}

const setPaid = async (registeredId: string) => {
    ConfirmationModal.open({
        title: $ts('set_payment_status'),
        body: $ts('set_payment_status_confirmation'),
        onConfirm: async () => {
            try {
                const response = await $api<IResponse>(`/api/agenda/${id}/participant/register/${registeredId}/pay`, {
                    method: 'put',
                    body: {
                        paymentMethod: 'cash'
                    }
                });
                if (response.statusCode != 200) {
                    return toast.add({ title: $ts('failed'), description: $ts('failed_to_set_payment_status'), color: 'error' });
                }
                refresh();
                return toast.add({
                    title: $ts('success'),
                    description: $ts('success_to_set_payment_status'),
                    color: 'success',
                })
            } catch (error: any) {
                toast.add({
                    title: $ts('failed'),
                    description: $ts('failed_to_setyment_status'),
                    color: 'error',
                })
            } finally {
                ConfirmationModal.close();
            }
        }
    });
}

const setVisited = async (registeredId: string) => {
    try {
        const response = await $api<IResponse>(`/api/agenda/${id}/participant/register/${registeredId}/visited`);
        if (response.statusCode != 200) {
            return toast.add({ title: $ts('failed'), description: $ts('failed_to_set_visit_status'), color: 'error' });
        }
        refresh();
        return toast.add({
            title: $ts('success'),
            description: $ts('success_to_set_visit_status'),
            color: 'success',
        })
    } catch (error: any) {
        toast.add({
            title: $ts('failed'),
            description: $ts('failed_to_set_visit_status'),
            color: 'error',
        })
    }
}

const setBatch = async (field: 'payment' | 'visiting') => {
    if (selectedParticipant.value.length === 0) {
        return toast.add({ title: $ts('no_participant_selected'), color: 'warning' });
    }
    ConfirmationModal.open({
        title: field === 'payment' ? $ts('set_payment_status') : $ts('set_visit_status'),
        body: field === 'payment' ? $ts('set_payment_status_confirmation') : $ts('set_visit_status_confirmation'),
        onConfirm: async () => {
            try {
                const response = await $api<IResponse>(`/api/agenda/${id}/participant/register/batch`, {
                    method: 'post',
                    body: {
                        participants: selectedParticipant.value.map((p) => p._id),
                        field
                    }
                });
                if (response.statusCode != 200) {
                    return toast.add({ title: $ts('failed'), description: field === 'payment' ? $ts('success_to_set_payment_status') : $ts('success_to_set_visit_status'), color: 'error' });
                }
                refresh();
                return toast.add({
                    title: $ts('success'),
                    description: field === 'payment' ? $ts('success_to_set_payment_status') : $ts('success_to_set_visit_status'),
                    color: 'success',
                })
            } catch (error: any) {
                toast.add({
                    title: $ts('failed'),
                    description: field === 'payment' ? $ts('failed_to_set_payment_status') : $ts('failed_to_set_visit_status'),
                    color: 'error',
                })
            } finally {
                ConfirmationModal.close();
            }
        }
    });
}

const openSetVisitedModal = (registeredId: string) => {
    ConfirmationModal.open({
        title: $ts('set_visit_status'),
        body: $ts('set_visit_status_confirmation'),
        onConfirm: async () => {
            await setVisited(registeredId);
            ConfirmationModal.close();
        }
    })
}

const openQrReader = () => {
    QRCodeModalComp.open({
        async getDataMethod(data: string) {
            try {
                const response = await $api<IResponse & { data: string }>(`/api/agenda/${id}/participant/register/${data}/registered`);
                return response.data;
            } catch (error: any) {
                toast.add({ title: "Failed to get data" });
            }
        },
        async onConfirm(data?: string) {
            if (!data) return;
            setVisited(data);
        }
    })
};

/**
 * Computed property for responsive UI sizes
 */
const responsiveUISizes = computed<{ [key: string]: 'xs' | 'md' }>(() => ({
    button: isMobile.value ? 'xs' : 'md',
    select: isMobile.value ? 'xs' : 'md',
    pagination: isMobile.value ? 'xs' : 'md',
}));
const links = computed(() => [{
    label: $ts('home'),
    icon: 'i-heroicons-home',
    to: '/'
}, {
    label: $ts('agenda'),
    icon: 'i-heroicons-calendar',
    to: '/agendas'
},
{
    label: agenda?.value?.title || 'Agenda',
    icon: 'i-heroicons-calendar',
    to: `/agendas/${id}`
},
{
    label: $ts('participant'),
    to: `/agendas/${id}/participant`,
    icon: 'i-heroicons-link'
}]);


useHead({
    title: () => `Participant - ${agenda.value?.title}`,
    meta: [
        {
            name: 'description',
            content: 'Participant users for the agenda'
        }
    ]
});
</script>
<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :items="links" />
        <UCard class="px-4 py-8 mt-2 md:px-8 md:py-12">
            <template #header>
                <div class="flex items-center justify-between w-full">
                    <h2 class="text-xl font-semibold dark:text-neutral-200">{{ $ts('participant') }}</h2>
                    <UButton :label="$ts('add')" :to="`/agendas/${id}/participant/add`" icon="i-heroicons-plus-circle"
                        :size="responsiveUISizes.button" class="my-2" v-if="isCommittee" />
                </div>
            </template>
            <!-- Header and Action buttons -->
            <div class="flex-row items-center justify-between hidden w-full gap-2 px-2 md:px-4 md:flex">
                <UInput v-model="search" icon="i-heroicons-magnifying-glass-20-solid" @keyup.enter="refresh()"
                    :loading="pending" :loading-icon="pending ? 'i-heroicons-arrow-path' : undefined"
                    :size="responsiveUISizes.input" class="w-full md:w-auto" />

                <div class="flex flex-wrap gap-1.5 items-center justify-center md:justify-end">
                    <div class="flex items-center gap-1.5" v-if="isCommittee">
                        <UButton v-if="selectedParticipant.length >= 1" icon="i-heroicons-arrow-down-tray" trailing
                            color="neutral" :size="responsiveUISizes.button" @click="generateXlsx">
                            {{ $ts('export_selected') }}
                        </UButton>
                        <UButton v-else icon="i-heroicons-arrow-down-tray" trailing color="neutral"
                            :size="responsiveUISizes.button" @click="generateXlsx">
                            {{ $ts('export_all') }}
                        </UButton>
                        <UButton v-if="selectedParticipant.length > 0" icon="i-heroicons-check-circle" trailing
                            :size="responsiveUISizes.button" @click="setBatch('visiting')">
                            {{ $ts('set_visit_status') }}
                        </UButton>
                        <UButton v-if="selectedParticipant.length > 0" icon="i-heroicons-banknotes" trailing
                            :size="responsiveUISizes.button" @click="setBatch('payment')">
                            {{ $ts('set_payment_status') }}
                        </UButton>
                    </div>
                    <UButton icon="i-heroicons-arrow-path" variant="ghost" :size="responsiveUISizes.button"
                        @click="refresh()" :loading="pending">
                    </UButton>
                </div>
            </div>
            <div class="overflow-x-auto">
                <UTable ref="table" v-model:pagination="pagination" v-model:row-selection="selectedRows"
                    :columns="columns" :data="members">
                    <template #expanded="{ row }">
                        <div class="p-2 text-sm text-gray-600 dark:text-gray-200">
                            <h3 class="text-lg font-semibold">{{ $ts('answer') }}</h3>
                            <div class="flex flex-col gap-2 mt-2">
                                <CoreQuestion v-for="(answer, index) in row.original.answers" :key="index"
                                    :question="(answer.question as IQuestion)" :is-editing="false" :type="'participant'"
                                    disabled v-model="answer.value" />
                            </div>
                        </div>
                    </template>
                </UTable>
                <div class="flex flex-col items-center justify-between w-full gap-4 sm:flex-row">
                    <USelect :label="$ts('rows_per_page')" :items="perPageOptions" v-model="pagination.pageSize"
                        :size="responsiveUISizes.select" />
                    <div>
                        <span>
                            {{ $ts('showing_results', { start: pageFrom, end: pageTo, total: pageTotal }) }}
                        </span>
                    </div>
                    <UPagination v-model:page="pagination.pageIndex" :items-per-page="pagination.pageSize"
                        :total="pageTotal" :sibling-count="1" show-edges />
                </div>
            </div>
            <template #footer>
                <UButton :label="$ts('register')" block :to="`/agendas/${id}/participant/register`"
                    v-if="isRegistered() === false && canMeRegister(agenda?.configuration.participant.canRegister || 'Public', agenda?.configuration.participant.canRegisterUntil.end)"
                    :size="responsiveUISizes.button" class="my-2" />
                <div v-else-if="isRegistered() === 'Participant' && payStatus() !== 'success'"
                    class="flex flex-wrap gap-2 my-4 w-full">
                    <UButton id="pay" class="flex-1" color="success" block :size="responsiveUISizes.button"
                        icon="i-heroicons-credit-card" :to="`/agendas/${id}/participant/register?tab=payment`"
                        target="_blank" v-if="agenda?.configuration.participant.pay">
                        {{ $ts('pay') }}
                    </UButton>
                    <UButton id="register" class="flex-1" color="success" block :size="responsiveUISizes.button"
                        icon="i-heroicons-user-plus" :to="`/agendas/${id}/participant/register?tab=answer_question`"
                        target="_blank">
                        {{ $ts('view_answer_registration') }}
                    </UButton>
                    <UButton id="cancel" class="flex-1" color="error" block :size="responsiveUISizes.button"
                        v-if="canMeUnregister" @click="cancelRegister" target="_blank">
                        {{ $ts('cancel') }} {{ $ts('register') }}
                    </UButton>
                </div>
                <UButton v-if="isCommittee" :label="$ts('qr_reader')" block icon="i-heroicons-qr-code"
                    :size="responsiveUISizes.button" @click="openQrReader" variant="outline" class="my-2" />
            </template>
        </UCard>
    </div>
</template>
<style scoped></style>