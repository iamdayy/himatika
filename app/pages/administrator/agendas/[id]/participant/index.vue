<script setup lang='ts'>
import { ModalsConfirmation, UCheckbox } from '#components';
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
const NuxtImg = resolveComponent('NuxtImg');
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
const organizerStore = useOrganizerStore();
const { isOrganizer } = storeToRefs(organizerStore);
const columns = computed<TableColumn<IParticipant>[]>(() => {
    const baseColumns: TableColumn<IParticipant>[] = [

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
            accessorKey: 'fullName',
            header: $ts('name'),
            size: 150,
            cell: ({ row }) => {
                return h('div', { class: 'flex flex-row items-center gap-2', }, [
                    h(NuxtImg, {
                        provider: 'localProvider',
                        src: (row.original.member as IMember | undefined)?.avatar as string || '/img/profile-blank.png',
                        class: 'object-cover rounded-full max-w-12 aspect-square',
                        alt: (row.original.member as IMember | undefined)?.fullName,
                    }),
                    h('div', {
                        class: 'flex flex-col items-start gap-1',
                    }, [
                        h('span', {
                            class: 'font-semibold text-gray-600 dark:text-gray-200'
                        }, row.original.member ? (row.original.member as IMember | undefined)?.fullName : (row.original.guest as IGuest)?.fullName),
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
                return row.original.guest ? (row.original.guest as IGuest | undefined)?.prodi || '-' : 'Informatika'
            }
        },
        {
            accessorKey: 'instution',
            header: $ts('instance'),
            cell: ({ row }) => {
                return row.original.guest ? (row.original.guest as IGuest | undefined)?.instance || '-' : 'ITSNU Pekalongan'
            }
        }
    ];

    if (isCommittee.value || isOrganizer.value) {
        const committeeColumns: TableColumn<IParticipant>[] = [
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
            icon: 'i-heroicons-eye-20-solid',
            label: $ts('view'),
            to: `profile/${(row.original.member as IMember)?.NIM || '-'}`,
            disabled: !isCommittee.value && !isOrganizer.value && !row.original.member,
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
            disabled: !isCommittee.value,
            onSelect: () => deleteParticipant(row.original._id as string)
        }
    ]
}

const members = computed(() => data.value?.data?.participants || []);

const printNametags = () => {
    // 1. Tentukan target data (Selected atau Semua)
    const targets = selectedParticipant.value.length > 0 ? selectedParticipant.value : members.value;

    if (targets.length === 0) {
        return toast.add({ title: 'Tidak ada data untuk dicetak', color: 'warning' });
    }

    // 2. Buka Jendela Baru
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) return;

    // 3. Definisi Style CSS (A4 Layout)
    const styles = `
        @page { size: A4; margin: 10mm; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
            margin: 0;
            padding: 0;
        }
        .grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 15px; 
            page-break-after: always;
        }
        .card { 
            border: 2px solid #000; 
            height: 250px; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            text-align: center; 
            padding: 20px;
            page-break-inside: avoid; 
            border-radius: 12px; 
            position: relative;
            background: #fff;
        }
        .header { 
            font-size: 14px; 
            text-transform: uppercase; 
            letter-spacing: 2px;
            margin-bottom: 20px; 
            color: #555; 
            font-weight: 600;
        }
        .name { 
            font-size: 28px; 
            font-weight: 800; 
            margin: 0; 
            line-height: 1.2;
            color: #000;
        }
        .meta { 
            font-size: 16px; 
            margin-top: 8px; 
            color: #333; 
            font-weight: 500;
        }
        .badge { 
            background: #000; 
            color: #fff; 
            padding: 6px 20px; 
            border-radius: 50px; 
            font-weight: bold; 
            margin-top: 20px; 
            font-size: 12px;
            text-transform: uppercase;
        }
        .footer { 
            position: absolute; 
            bottom: 12px; 
            font-size: 10px; 
            color: #888; 
        }
    `;

    // 4. Generate HTML Content (Looping Data)
    const cardsHtml = targets.map(p => {
        // Handle data aman (null safety)
        const member = p.member as IMember | undefined;
        const guest = p.guest as IGuest | undefined;

        const name = member?.fullName || guest?.fullName || 'Peserta';
        const subInfo = member?.NIM || guest?.instance || '-';
        const type = member ? 'MEMBER' : 'GUEST';

        return `
            <div class="card">
                <div class="header">${agenda.value?.title || 'EVENT CARD'}</div>
                <h1 class="name">${name}</h1>
                <p class="meta">${subInfo}</p>
                <div class="badge">${type}</div>
                <div class="footer">ID: ${p._id}</div>
            </div>
        `;
    }).join('');

    // 5. Manipulasi DOM Jendela Baru
    win.document.title = `Cetak Nametag - ${agenda.value?.title}`;

    // Inject Style ke <head>
    const styleSheet = win.document.createElement("style");
    styleSheet.innerText = styles;
    win.document.head.appendChild(styleSheet);

    // Inject Content ke <body>
    win.document.body.innerHTML = `
        <div class="grid">
            ${cardsHtml}
        </div>
    `;

    // 6. Print dengan sedikit delay (untuk memastikan render CSS selesai)
    setTimeout(() => {
        win.print();
        // win.close(); // Opsional
    }, 500);
};

// --- REFACTOR BULK ACTIONS ---
const bulkActions = computed<DropdownMenuItem[][]>(() => [
    [{
        label: `Terpilih (${selectedParticipant.value.length})`,
        disabled: true
    }],
    [{
        label: $ts('export_data'),
        icon: 'i-heroicons-document-arrow-down',
        onSelect: generateXlsx
    }, {
        label: 'Cetak Nametag',
        icon: 'i-heroicons-identification',
        onSelect: printNametags
    }],
    [{
        label: $ts('set_visit_status'),
        icon: 'i-heroicons-check-circle',
        disabled: selectedParticipant.value.length === 0,
        onSelect: () => setBatch('visiting')
    }, {
        label: $ts('set_payment_status'),
        icon: 'i-heroicons-banknotes',
        disabled: selectedParticipant.value.length === 0,
        onSelect: () => setBatch('payment')
    }]
]);

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

/**
 * Computed property for responsive UI sizes
 */
const responsiveUISizes = computed<{ [key: string]: 'xs' | 'md' }>(() => ({
    button: isMobile.value ? 'xs' : 'md',
    select: isMobile.value ? 'xs' : 'md',
    pagination: isMobile.value ? 'xs' : 'md',
}));
const links = computed(() => [{
    label: $ts('dashboard'),
    icon: 'i-heroicons-home',
    to: '/dashboard'
}, {
    label: $ts('agenda'),
    icon: 'i-heroicons-calendar',
    to: '/administrator/agendas'
},
{
    label: agenda?.value?.title || 'Agenda',
    icon: 'i-heroicons-calendar',
    to: `/administrator/agendas/${id}`
},
{
    label: $ts('participant'),
    to: `/administrator/agendas/${id}/participant`,
    icon: 'i-heroicons-link'
}]);


useHead({
    title: () => `${$ts('participant')} - ${agenda.value?.title}`,
    meta: [
        {
            name: 'description',
            content: `'${agenda.value?.title} participant list'`
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
                    <UButton :label="$ts('add')" :to="`/administrator/agendas/${id}/participant/add`"
                        icon="i-heroicons-plus-circle" :size="responsiveUISizes.button" class="my-2" variant="outline"
                        v-if="isCommittee" />
                </div>
            </template>

            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full mb-4">
                <UInput v-model="search" icon="i-heroicons-magnifying-glass-20-solid" @keyup.enter="refresh()"
                    :loading="pending"
                    :placeholder="$ts('search_placeholder', { key: $ts('participant') }) || 'Cari nama / NIM...'"
                    :size="responsiveUISizes.input" class="w-full md:w-64" />

                <div class="flex items-center gap-2 self-end">
                    <UDropdownMenu v-if="isCommittee" :items="bulkActions" :popper="{ placement: 'bottom-end' }">
                        <UButton color="white" icon="i-heroicons-cog-6-tooth" trailing-icon="i-heroicons-chevron-down">
                            {{ selectedParticipant.length > 0 ? `${selectedParticipant.length} Selected` : 'Aksi Massal'
                            }}
                        </UButton>
                    </UDropdownMenu>

                    <UButton icon="i-heroicons-arrow-path" variant="ghost" color="gray" @click="refresh()"
                        :loading="pending" tooltip="Refresh Data" />
                </div>
            </div>
            <div class="overflow-x-auto">
                <UTable ref="table" v-model:row-selection="selectedRows" :columns="columns" :data="members"
                    :loading="pending">
                    <template #empty-state>
                        <div class="flex flex-col items-center justify-center py-12 text-gray-400">
                            <UIcon name="i-heroicons-user-group" class="w-12 h-12 mb-3 opacity-20" />
                            <span class="text-sm">Belum ada data panitia</span>
                        </div>
                    </template>
                </UTable>
                <div
                    class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-100 dark:border-gray-800">
                    <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
                        <span>Rows:</span>
                        <USelectMenu v-model="pagination.pageSize" :items="perPageOptions" size="xs" class="w-20" />
                    </div>

                    <UPagination v-model:page="pagination.pageIndex" :items-per-page="pagination.pageSize"
                        :total="pageTotal" :sibling-count="1" size="sm" />
                </div>
            </div>
        </UCard>
    </div>
</template>
<style scoped></style>