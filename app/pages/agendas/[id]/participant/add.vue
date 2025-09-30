<script setup lang='ts'>
import { NuxtImg, UButton, UCheckbox, UIcon } from '#components';
import type { TableColumn } from '@nuxt/ui';
import type { IMember, IParticipant } from '~~/types';
import type { IAgendaResponse, IMemberResponse, IResponse } from '~~/types/IResponse';


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

const memberSearchTerm = ref('');
const { id } = useRoute().params as { id: string };
const { $ts, $api } = useNuxtApp();
const toast = useToast();
const config = useRuntimeConfig();

const { data: agenda, refresh } = useLazyAsyncData('agenda', async () => $api<IAgendaResponse>('/api/agenda', {
    query: {
        id
    }
}), {
    transform: (data) => data.data?.agenda,
    default: undefined
});

const { data: members, status: memberstatus, refresh: refreshMembers } = useAsyncData(() => $api<IMemberResponse>("/api/member", {
    method: 'GET',
    params: {
        search: memberSearchTerm.value,
        page: 1,
        perPage: 10
    }
}), {
    transform: (data) => {
        const members = data.data?.members || [];
        return members.filter((member) => {

            const memberRegistered = agenda.value?.participants?.map((participant) => (participant.member as IMember | undefined)?.NIM) || [];
            return !memberRegistered.includes(member.NIM);
        });;
    },
    default: () => undefined,
    watch: [memberSearchTerm, agenda],
});

const state = reactiveComputed<IParticipant>(() => ({
    member: 0,
}));
const columns = computed<TableColumn<IMember>[]>(() => [
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
            return h('div', {
                class: 'flex flex-row items-center gap-2',
            }, [
                h(NuxtImg, {
                    provider: 'localProvider',
                    src: row.original?.avatar as string || '/img/profile-blank.png',
                    class: 'object-cover rounded-full max-w-12 aspect-square',
                }),
                h('div', {
                    class: 'flex flex-col items-start gap-1',
                }, [
                    h('span', {
                        class: 'font-semibold text-gray-600 dark:text-gray-200'
                    }, row.original.fullName,
                    ),
                    h('span', {
                        class: 'text-sm font-light text-gray-600 dark:text-gray-300'
                    }, `${row.original?.NIM} | ${row.original?.email}`),
                ]),
            ]);
        }
    },
    {
        accessorKey: 'class',
        header: $ts('class'),
        sortable: true,
        cell: ({ row }) => {
            return row.original?.class
        }
    },
    {
        accessorKey: 'semester',
        header: $ts('semester'),
        sortable: true,
        cell: ({ row }) => {
            return row.original?.semester
        }
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            return h(
                'div',
                { class: 'text-right' },
                h(
                    UButton,
                    {
                        size: responsiveUISizes.value.button,
                        onClick: async () => {
                            try {

                                state.member = row.original.NIM;
                                await add(row.original.NIM);
                            } catch (error) {
                                toast.add({
                                    title: $ts('error'),
                                    description: $ts('add-participant-failed'),
                                    color: 'error'
                                });
                            } finally {
                                state.member = 0;
                            }
                        },
                    },
                    [
                        h(UIcon, { name: 'i-heroicons-plus-circle' }),
                        h('span', {}, $ts('add')),
                    ]
                )
            )
        }
    }
])

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
}, {
    label: $ts('add'),
    icon: 'i-heroicons-plus-circle'
}]);

const add = async (NIM: number) => {
    try {
        const data = await $api<IResponse>(`/api/agenda/${id}/participant`, {
            method: 'POST',
            body: {
                member: NIM
            }
        });
        if (data.statusCode === 200) {
            toast.add({
                title: $ts('success'),
                description: $ts('add-participant-success'),
                color: 'success'
            });
            refreshMembers();
        } else {
            toast.add({
                title: $ts('error'),
                description: $ts('add-participant-failed'),
                color: 'error'
            });
        }
    } catch (error) {
        toast.add({
            title: $ts('error'),
            description: $ts('add-participant-failed'),
            color: 'error'
        });
    }
};

useHead({
    title: () => `Participant - ${agenda.value?.title}`,
    meta: [
        {
            name: 'description',
            content: 'Participant users for the agenda'
        }
    ]
});
definePageMeta({
    layout: 'client',
    middleware: ['sidebase-auth', 'organizer']
});
</script>
<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :items="links" />
        <UCard class="px-4 py-8 mt-2 md:px-8 md:py-12">
            <template #header>
                <div class="flex items-center justify-between w-full">
                    <h2 class="text-xl font-semibold dark:text-neutral-200">{{ $ts('add') }}</h2>
                </div>
            </template>
            <div class="grid grid-cols-1 gap-4 mt-4">
                <!-- <USelectMenu :items="members" :loading="memberstatus === 'pending'"
                    v-model:search-term="memberSearchTerm" :filter-fields="['label', 'email']" icon="i-lucide-user"
                    :placeholder="$ts('search')" v-model="(state.member as number)" value-key="value"
                    :ui="{ base: 'max-w-full w-full' }" class="w-full" :size="responsiveUISizes.input">
                    <template #item-label="{ item }">
                        {{ item.label }}
                        <span class="text-(--ui-text-muted)">
                            {{ item.email }}
                        </span>
                    </template>
                </USelectMenu> -->
                <UInput v-model="memberSearchTerm" :placeholder="$ts('search')" :size="responsiveUISizes.input"
                    icon="i-lucide-search" class="w-full" />

                <UTable :columns="columns" :data="members" :loading="memberstatus === 'pending'" class="w-full"
                    :ui="{ base: 'max-w-full w-full' }" />
            </div>
            <template #footer>
                <div class="flex items-center justify-end w-full mt-4">
                    <UButton :size="responsiveUISizes.button" @click="$router.back()" class="mr-2" variant="subtle">
                        {{ $ts('cancel') }}
                    </UButton>
                    <!-- <UButton :size="responsiveUISizes.button" @click="add" class="w-full md:w-auto"
                        :loading="memberstatus === 'pending'">
                        {{ $ts('add') }}
                    </UButton> -->
                </div>
            </template>
        </UCard>
    </div>
</template>
<style scoped></style>