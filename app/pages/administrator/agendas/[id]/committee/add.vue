<script setup lang='ts'>
import { NuxtImg, UButton, UIcon } from '#components';
import type { TableColumn } from '@nuxt/ui';
import type { IMember } from '~~/types';
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

interface IStagedCommittee {
    member: IMember;
    job: string;
}

const stagedCommittees = ref<IStagedCommittee[]>([]);

const { data: agenda, refresh } = useLazyAsyncData('agenda', async () => $api<IAgendaResponse>('/api/agenda', {
    query: {
        id
    }
}), {
    transform: (data) => data.data?.agenda,
    default: undefined
});

const { data: members, status: memberstatus, refresh: refreshMembers } = useAsyncData('members', () => $api<IMemberResponse>("/api/member", {
    method: 'GET',
    params: {
        search: memberSearchTerm.value,
        page: 1,
        perPage: 10
    }
}), {
    transform: (data) => {
        const members = data.data?.members || [];
        const committeeNIMs = agenda.value?.committees?.map((c) => (c.member as IMember)?.NIM) || [];
        const stagedNIMs = stagedCommittees.value.map(sc => sc.member.NIM);
        return members.filter((member) => !committeeNIMs.includes(member.NIM) && !stagedNIMs.includes(member.NIM));
    },
    default: () => [],
    watch: [memberSearchTerm, agenda],
});


const columns = computed<TableColumn<IMember>[]>(() => [
    {
        accessorKey: 'fullName',
        header: $ts('name'),
        size: 150,
        cell: ({ row }) => h('div', { class: 'flex items-center gap-2' }, [
            h(NuxtImg, { provider: 'localProvider', src: row.original?.avatar as string || '/img/profile-blank.png', class: 'object-cover rounded-full max-w-12 aspect-square', alt: row.original?.fullName, loading: 'lazy' }),
            h('div', { class: 'flex flex-col items-start gap-1' }, [
                h('span', { class: 'font-semibold text-gray-600 dark:text-gray-200' }, row.original.fullName),
                h('span', { class: 'text-sm font-light text-gray-600 dark:text-gray-300' }, `${row.original?.NIM} | ${row.original?.email}`),
            ]),
        ])
    },
    { accessorKey: 'class', header: $ts('class'), sortable: true },
    { accessorKey: 'semester', header: $ts('semester'), sortable: true },
    {
        id: 'actions',
        cell: ({ row }) => h('div', { class: 'text-right' },
            h(UButton, { size: responsiveUISizes.value.button, onClick: () => addToStaging(row.original) },
                [h(UIcon, { name: 'i-heroicons-plus-circle' }), h('span', {}, $ts('add'))]
            )
        )
    }
]);

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
    label: $ts('committee'),
    to: `/administrator/agendas/${id}/committee`,
    icon: 'i-heroicons-users'
}, {
    label: $ts('add'),
    icon: 'i-heroicons-plus-circle'
}]);

const addToStaging = (member: IMember) => {
    stagedCommittees.value.push({ member, job: '' });
    refreshMembers();
};

const removeFromStaging = (member: IMember) => {
    stagedCommittees.value = stagedCommittees.value.filter(sc => sc.member.NIM !== member.NIM);
    refreshMembers();
};

const registerCommittee = async (committee: IStagedCommittee) => {
    try {
        const data = await $api<IResponse>(`/api/agenda/${id}/committee`, {
            method: 'POST',
            body: {
                member: committee.member.NIM,
                job: committee.job
            }
        });
        if (data.statusCode === 200) {
            toast.add({ title: $ts('success'), description: $ts('add-committee-success'), color: 'success' });
            return true;
        } else {
            toast.add({ title: $ts('error'), description: data.statusMessage || $ts('add-committee-failed'), color: 'error' });
            return false;
        }
    } catch (error: any) {
        toast.add({ title: $ts('error'), description: error.message || $ts('add-committee-failed'), color: 'error' });
        return false;
    }
};

const registerAllStaged = async () => {
    const promises = stagedCommittees.value.map(committee => registerCommittee(committee));
    const results = await Promise.all(promises);

    const successfulRegistrations = stagedCommittees.value.filter((_, index) => results[index]);

    if (successfulRegistrations.length > 0) {
        stagedCommittees.value = stagedCommittees.value.filter(committee => !successfulRegistrations.some(s => s.member.NIM === committee.member.NIM));
        refreshMembers();
        refresh(); // Refresh agenda data to update committee list
    }

    if (successfulRegistrations.length === promises.length) {
        toast.add({ title: $ts('success'), description: $ts('all-committees-added-successfully'), color: 'success' });
    } else {
        toast.add({ title: $ts('warning'), description: $ts('some-committees-failed-to-add'), color: 'warning' });
    }
};

useHead({
    title: () => `${$ts('add-manual-committee')} - ${agenda.value?.title}`,
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
                    <h2 class="text-xl font-semibold dark:text-neutral-200">{{ $ts('add-manual-committee') }}</h2>
                </div>
            </template>
            <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
                <!-- Search and Results Section -->
                <div class="flex flex-col gap-4">
                    <UInput v-model="memberSearchTerm" :placeholder="$ts('search-member')"
                        :size="responsiveUISizes.input" icon="i-lucide-search" class="w-full" />

                    <UTable :columns="columns" :data="members" :loading="memberstatus === 'pending'" class="w-full"
                        :ui="{ base: 'max-w-full w-full' }" />
                </div>

                <!-- Staged Members Section -->
                <div class="flex flex-col gap-4">
                    <h3 class="text-lg font-semibold dark:text-neutral-200">{{ $ts('committee-to-register') }} ({{
                        stagedCommittees.length
                    }})</h3>
                    <div class="flex flex-col gap-2 overflow-y-auto max-h-96">
                        <UCard v-for="committee in stagedCommittees" :key="committee.member.NIM" class="p-2">
                            <div class="flex items-start justify-between">
                                <div class="flex items-center gap-2">
                                    <NuxtImg :provider="'localProvider'"
                                        :src="committee.member.avatar || '/img/profile-blank.png'"
                                        class="object-cover rounded-full w-10 h-10" :alt="committee.member.fullName"
                                        loading="lazy" />
                                    <div>
                                        <p class="font-semibold">{{ committee.member.fullName }}</p>
                                        <p class="text-sm text-gray-500">{{ committee.member.NIM }}</p>
                                    </div>
                                </div>
                                <UButton icon="i-heroicons-x-mark" color="error" variant="ghost"
                                    @click="removeFromStaging(committee.member)" />
                            </div>
                            <UInput v-model="committee.job" :placeholder="$ts('job')" class="mt-2" />
                        </UCard>
                        <div v-if="stagedCommittees.length === 0" class="text-center text-gray-500">
                            {{ $ts('no-committee-selected') }}
                        </div>
                    </div>
                    <UButton :size="responsiveUISizes.button" @click="registerAllStaged" class="w-full mt-4"
                        :disabled="stagedCommittees.length === 0" :loading="memberstatus === 'pending'">
                        {{ $ts('register-all-staged') }} ({{ stagedCommittees.length }})
                    </UButton>
                </div>
            </div>

            <template #footer>
                <div class="flex items-center justify-end w-full mt-4">
                    <UButton :size="responsiveUISizes.button" @click="$router.back()" class="mr-2" variant="subtle">
                        {{ $ts('back') }}
                    </UButton>
                </div>
            </template>
        </UCard>
    </div>
</template>
<style scoped></style>
