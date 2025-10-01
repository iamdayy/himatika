<template>
    <div class="min-h-screen py-8">
        <div class="mx-auto px-4 sm:px-6 lg:px-8" v-if="member">
            <!-- Profile Header -->
            <UCard class="rounded-lg shadow-sm border border-gray-200 mb-6">
                <div class="p-6">
                    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <!-- Avatar -->
                        <div class="flex-shrink-0">
                            <NuxtImg provider="localProvider"
                                :src="member.avatar || '/placeholder.svg?height=120&width=120'" :alt="member.fullName"
                                class="ring-4 ring-white shadow-lg rounded-full max-w-[120px] max-h-[120px]" />
                        </div>

                        <!-- Basic Info -->
                        <div class="flex-1 min-w-0">
                            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h1 class="text-2xl font-bold">{{ member.fullName }}</h1>
                                    <p class="text-lg text-gray-600 dark:text-gray-300">NIM: {{ member.NIM }}</p>
                                    <div class="flex items-center gap-4 mt-2">
                                        <UBadge
                                            :color="member.status === 'active' ? 'success' : member.status === 'inactive' ? 'error' : 'neutral'"
                                            variant="subtle" size="sm">
                                            {{ member.status?.toUpperCase() || 'UNKNOWN' }}
                                        </UBadge>
                                        <span class="text-sm text-gray-500 dark:text-gray-300">{{ member.class }} •
                                            Semester {{
                                                member.semester }}</span>
                                    </div>
                                </div>

                                <!-- Action Buttons -->
                                <div class="flex gap-2 mt-4 sm:mt-0">
                                    <!-- TODO: Implement edit functionality -->
                                    <!-- <UButton color="neutral" variant="outline" size="sm" v-if="isOrganizer">
                                        <UIcon name="i-heroicons-pencil-square" class="w-4 h-4 mr-2" />
                                        {{ $ts('edit') }}
                                    </UButton> -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </UCard>

            <!-- Content Tabs -->
            <UTabs :items="tabs" class="w-full">
                <!-- Personal Information Tab -->
                <template #personal="{ item }">
                    <div class="space-y-6">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <!-- Personal Details Card -->
                            <UCard>
                                <template #header>
                                    <h3 class="text-lg font-semibold">{{ $ts('personal_information') }}</h3>
                                </template>

                                <div class="space-y-4">

                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label
                                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{
                                                    $ts('birth')
                                                }}</label>
                                            <p class="text-sm">{{ member.birth?.place || 'Not specified' }},
                                                {{ member.birth?.date ? formatDate(member.birth.date) : 'Not specified'
                                                }}
                                            </p>
                                        </div>
                                        <div>
                                            <label
                                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{
                                                    $ts('gender') }}</label>
                                            <p class="text-sm capitalize">{{ member.sex || 'Not specified' }}</p>
                                        </div>
                                        <div>
                                            <label
                                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{
                                                    $ts('religion') }}</label>
                                            <p class="text-sm">{{ member.religion || 'Not specified' }}</p>
                                        </div>
                                        <div>
                                            <label
                                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{
                                                    $ts('citizenship') }}</label>
                                            <p class="text-sm">{{ member.citizen || 'Not specified' }}</p>
                                        </div>
                                    </div>

                                </div>
                            </UCard>

                            <!-- Contact Information Card -->
                            <UCard>
                                <template #header>
                                    <h3 class="text-lg font-semibold">{{ $ts('contact_information') }}</h3>
                                </template>

                                <div class="space-y-4">
                                    <div>
                                        <label
                                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{
                                                $ts('email') }}</label>
                                        <div class="flex items-center gap-2">
                                            <UIcon name="i-heroicons-envelope" class="w-4 h-4 text-gray-400" />
                                            <p class="text-sm">{{ member.email }}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{
                                                $ts('phone') }}</label>
                                        <div class="flex items-center gap-2">
                                            <UIcon name="i-heroicons-phone" class="w-4 h-4 text-gray-400" />
                                            <p class="text-sm">{{ member.phone || 'Not specified' }}</p>
                                        </div>
                                    </div>

                                    <div v-if="member.address">
                                        <label
                                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{
                                                $ts('address') }}</label>
                                        <div class="flex items-start gap-2">
                                            <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-gray-400 mt-0.5" />
                                            <div class="text-sm">
                                                <p>{{ member.address.fullAddress }}</p>
                                                <p class="text-gray-600">
                                                    {{ member.address.village }}, {{ member.address.district }},
                                                    {{ member.address.city }}, {{ member.address.province }} {{
                                                        member.address.zip }}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </UCard>
                        </div>
                        <!-- Academic Details -->
                        <UCard>
                            <template #header>
                                <h3 class="text-lg font-semibold">{{ $ts('academic_information') }}</h3>
                            </template>

                            <div class="space-y-4">
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{
                                                $ts('class')
                                            }}</label>
                                        <p class="text-sm">{{ member.class }}</p>
                                    </div>
                                    <div>
                                        <label
                                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{
                                                $ts('semester') }}</label>
                                        <p class="text-sm">{{ member.semester }}</p>
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{
                                        $ts('generation')
                                    }}</label>
                                    <p class="text-sm">{{ member.enteredYear || 'Not specified' }}</p>
                                </div>
                            </div>
                        </UCard>
                    </div>
                </template>

                <!-- Organization Tab -->
                <template #organization="{ item }">
                    <div class="space-y-6">
                        <!-- Current Role -->
                        <UCard v-if="member.organizer">
                            <template #header>
                                <h3 class="text-lg font-semibold">{{ $ts('organization') }}</h3>
                            </template>

                            <div class="flex items-center justify-between">
                                <div>
                                    <h4 class="font-medium">{{ member.organizer.role }}</h4>
                                    <p class="text-sm text-gray-600 dark:text-gray-300">
                                        {{ formatDate(member.organizer.period.start) }} - {{
                                            formatDate(member.organizer.period.end) }}
                                    </p>
                                </div>
                                <UBadge
                                    :color="new Date(member.organizer.period.end) > new Date() ? 'success' : 'neutral'"
                                    variant="subtle">
                                    {{ new Date(member.organizer.period.end) > new Date() ? $ts('active') :
                                        $ts('inactive') }}
                                </UBadge>
                            </div>
                        </UCard>
                        <!-- Points Summary -->
                        <UCard>
                            <template #header>
                                <h3 class="text-lg font-semibold">{{ $ts('point_summary') }}</h3>
                            </template>

                            <div class="space-y-4">
                                <div v-if="member.point && member.point.length > 0">
                                    <UAccordion :items="pointAccordionItems" :ui="{ label: 'w-full flex-1' }">
                                        <template #default="{ index }">
                                            <div class="flex justify-between items-center mb-2 w-full">
                                                <span
                                                    class="text-sm font-medium text-gray-700 dark:text-gray-300">Semester
                                                    {{ member.point[index]!.semester
                                                    }}</span>
                                                <UBadge color="secondary" variant="subtle">{{ member.point[index]!.point
                                                    }} pts</UBadge>
                                            </div>
                                            <div class="text-xs text-gray-500 dark:text-gray-300">
                                                {{ formatDate(member.point[index]!.range.start) }} - {{
                                                    formatDate(member.point[index]!.range.end) }}
                                            </div>
                                            <div class="grid grid-cols-3 gap-2 mt-2 text-xs">
                                                <div class="text-center">
                                                    <div class="font-medium">{{
                                                        member.point[index]!.activities.agendas.committees +
                                                        member.point[index]!.activities.agendas.participants }}</div>
                                                    <div class="text-gray-500 dark:text-gray-300">{{ $ts('agenda') }}
                                                    </div>
                                                </div>
                                                <div class="text-center">
                                                    <div class="font-medium">{{ member.point[index]!.activities.projects
                                                        }}</div>
                                                    <div class="text-gray-500 dark:text-gray-300">{{ $ts('project') }}
                                                    </div>
                                                </div>
                                                <div class="text-center">
                                                    <div class="font-medium">{{
                                                        member.point[index]!.activities.aspirations }}</div>
                                                    <div class="text-gray-500 dark:text-gray-300">{{ $ts('aspiration')
                                                    }}</div>
                                                </div>
                                            </div>
                                        </template>
                                        <template #content="{ index }">
                                            <div class="space-y-4">
                                                <!-- Activities Summary -->
                                                <!-- Agendas -->
                                                <UCard>
                                                    <template #header>
                                                        <div class="flex items-center justify-between">
                                                            <h3 class="text-lg font-semibold">{{ $ts('agenda') }}</h3>
                                                            <UBadge variant="subtle">
                                                                {{
                                                                    (getAgendasCommitteeByRange(member.point[index]!.range)?.length
                                                                        || 0) +
                                                                    (getAgendasMemberByRange(member.point[index]!.range)?.length
                                                                        || 0)
                                                                }} total
                                                            </UBadge>
                                                        </div>
                                                    </template>

                                                    <div class="space-y-4">
                                                        <div
                                                            v-if="getAgendasCommitteeByRange(member.point[index]!.range) && getAgendasCommitteeByRange(member.point[index]!.range).length > 0">
                                                            <h4 class="font-medium mb-2">{{ $ts('committee') }}</h4>
                                                            <div class="space-y-2">
                                                                <div v-for="agenda, i in getAgendasCommitteeByRange(member.point[index]!.range)"
                                                                    :key="i"
                                                                    class="flex items-center justify-between p-3 bg-green-50/20 rounded-lg">
                                                                    <div>
                                                                        <p class="font-medium">{{ agenda.title }}</p>
                                                                        <p
                                                                            class="text-sm text-gray-600 dark:text-gray-300">
                                                                            {{ agenda.at }}</p>
                                                                    </div>
                                                                    <UBadge color="success" variant="subtle">{{
                                                                        $ts('committee') }}</UBadge>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div
                                                            v-if="getAgendasMemberByRange(member.point[index]!.range) && getAgendasMemberByRange(member.point[index]!.range).length > 0">
                                                            <h4 class="font-medium mb-2">{{ $ts('participant') }}
                                                            </h4>
                                                            <div class="space-y-2">
                                                                <div v-for="agenda, i in getAgendasMemberByRange(member.point[index]!.range)"
                                                                    :key="i"
                                                                    class="flex items-center justify-between p-3 bg-blue-50/20 rounded-lg">
                                                                    <div>
                                                                        <p class="font-medium">{{ agenda.title }}</p>
                                                                        <p
                                                                            class="text-sm text-gray-600 dark:text-gray-300">
                                                                            {{ agenda.at }}</p>
                                                                    </div>
                                                                    <UBadge variant="subtle">{{ $ts('participant') }}
                                                                    </UBadge>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div v-if="(!getAgendasCommitteeByRange(member.point[index]!.range) || getAgendasCommitteeByRange(member.point[index]!.range).length === 0) && (!getAgendasMemberByRange(member.point[index]!.range) || getAgendasMemberByRange(member.point[index]!.range).length === 0)"
                                                            class="text-center text-gray-500 dark:text-gray-300 py-4">
                                                            {{ $ts('no_agendas') }}
                                                        </div>
                                                    </div>
                                                </UCard>
                                                <!-- Projects -->
                                                <UCard>
                                                    <template #header>
                                                        <div class="flex items-center justify-between">
                                                            <h3 class="text-lg font-semibold">Projects</h3>
                                                            <UBadge variant="subtle">{{
                                                                getProjectsByRange(member.point[index]!.range)?.length
                                                                ||
                                                                0
                                                                }} projects</UBadge>
                                                        </div>
                                                    </template>

                                                    <div class="space-y-4">
                                                        <div
                                                            v-if="getProjectsByRange(member.point[index]!.range) && getProjectsByRange(member.point[index]!.range).length > 0">
                                                            <div v-for="project in getProjectsByRange(member.point[index]!.range)"
                                                                :key="project._id"
                                                                class="flex items-center justify-between p-3 bg-purple-50/20 rounded-lg">
                                                                <div class="flex-1">
                                                                    <p class="font-medium">{{ project.title }}</p>
                                                                    <p class="text-sm text-gray-600">{{
                                                                        project.description
                                                                        }}</p>
                                                                    <div class="flex items-center gap-2 mt-2">
                                                                        <div
                                                                            class="w-full bg-gray-200 rounded-full h-2">
                                                                            <div class="bg-purple-600 h-2 rounded-full"
                                                                                :style="{ width: project.progress + '%' }">
                                                                            </div>
                                                                        </div>
                                                                        <span
                                                                            class="text-xs text-gray-500 dark:text-gray-300">{{
                                                                                project.progress }}%</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div v-else
                                                            class="text-center text-gray-500 dark:text-gray-300 py-4">
                                                            {{ $ts('no_projects') }}
                                                        </div>
                                                    </div>
                                                </UCard>
                                                <!-- Aspirations -->
                                                <UCard>
                                                    <template #header>
                                                        <div class="flex items-center justify-between">
                                                            <h3 class="text-lg font-semibold">{{ $ts('aspiration') }}
                                                            </h3>
                                                            <UBadge variant="subtle">{{
                                                                getAspirationsByRange(member.point[index]!.range)?.length
                                                                ||
                                                                0 }} {{ $ts('aspiration') }}
                                                            </UBadge>
                                                        </div>
                                                    </template>
                                                    <div
                                                        v-if="getAspirationsByRange(member.point[index]!.range) && getAspirationsByRange(member.point[index]!.range).length > 0">
                                                        <div class="space-y-4">
                                                            <div v-for="aspiration, i in getAspirationsByRange(member.point[index]!.range)"
                                                                :key="i"
                                                                class="flex items-center justify-between p-3 bg-yellow-50/20 rounded-lg">
                                                                <div class="flex-1">
                                                                    <p class="font-medium">{{ aspiration.subject }}</p>
                                                                </div>
                                                                <UBadge variant="subtle">{{ aspiration.totalVotes }}
                                                                </UBadge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div v-else
                                                        class="text-center text-gray-500 dark:text-gray-300 py-4">
                                                        {{ $ts('no_aspirations') }}
                                                    </div>
                                                </UCard>
                                            </div>

                                        </template>

                                    </UAccordion>

                                </div>
                                <div v-else class="text-center text-gray-500 dark:text-gray-300 py-4">
                                    {{ $ts('no_points_data') }}
                                </div>
                            </div>
                        </UCard>
                    </div>
                </template>
            </UTabs>
        </div>
        <div v-else class="mx-auto px-4 sm:px-6 lg:px-8">
            <UCard class="rounded-lg shadow-sm border border-gray-200">
                <div class="p-6 text-center">
                    <USkeleton class="w-24 h-24 mx-auto mb-4" />
                    <USkeleton class="w-1/2 h-6 mx-auto mb-2" />
                    <USkeleton class="w-1/3 h-4 mx-auto mb-4" />
                    <USkeleton class="w-1/4 h-4 mx-auto mb-6" />
                    <USkeleton class="w-1/3 h-10 mx-auto" />
                </div>
            </UCard>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { AccordionItem, TabsItem } from '@nuxt/ui';
import type { IMember } from '~~/types';
import type { IMemberResponse } from '~~/types/IResponse';
const { $api, $ts } = useNuxtApp();
const { isOrganizer } = useOrganizer();
const { data: memberData } = await useAsyncData<IMemberResponse>('member', async () => {
    const NIM = useRoute().params.NIM as string
    return await $api(`/api/member`, {
        method: 'GET',
        query: { NIM }
    })
}, {
});

// Sample member data based on the interfaces
const member = computed<IMember | undefined>(() => memberData.value?.data?.member);

const tabs = computed<TabsItem[]>(() => [
    {
        slot: 'personal' as const,
        label: $ts('profile_tabs_personal'),
        icon: 'i-heroicons-user'
    },
    {
        slot: 'organization' as const,
        label: $ts('profile_tabs_organization'),
        icon: 'i-heroicons-building-office'
    },
] satisfies TabsItem[]);

const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}
const pointAccordionItems = computed<AccordionItem[]>(() => {
    return member.value?.point?.map(point => ({
        label: `Semester ${point.semester}`,
    })) || [];
});
const getAgendasCommitteeByRange = (range: { start: Date; end: Date }) => {
    const start = new Date(range.start);
    const end = new Date(range.end);
    const agendas = member.value?.agendasCommittee?.filter(agenda => {
        const agendaDateStart = new Date(agenda.date.start as string);
        const agendaDateEnd = new Date(agenda.date.end as string);
        return agendaDateStart >= start && agendaDateEnd <= end;
    }) || [];
    return agendas;
};
const getAgendasMemberByRange = (range: { start: Date; end: Date }) => {
    const start = new Date(range.start);
    const end = new Date(range.end);
    const agendas = member.value?.agendasMember?.filter(agenda => {
        const agendaDateStart = new Date(agenda.date.start as string);
        const agendaDateEnd = new Date(agenda.date.end as string);
        return agendaDateStart >= start && agendaDateEnd <= end;
    }) || [];
    return agendas;
};
const getProjectsByRange = (range: { start: Date; end: Date }) => {
    const start = new Date(range.start);
    const end = new Date(range.end);
    const projects = member.value?.projects?.filter(project => {
        const projectDate = new Date(project.date);
        return projectDate >= start && projectDate <= end;
    }) || [];
    return projects;
};
const getAspirationsByRange = (range: { start: Date; end: Date }) => {
    const start = new Date(range.start);
    const end = new Date(range.end);
    const aspirations = member.value?.aspirations?.filter(aspiration => {
        const aspirationDate = new Date(aspiration.createdAt!);
        return aspirationDate >= start && aspirationDate <= end && !aspiration.anonymous;
    }) || [];
    return aspirations;
};

definePageMeta({
    layout: 'dashboard',
    auth: true,
});
useHead({
    title: 'Profile - ' + (member.value?.fullName || 'Loading...'),
    meta: [
        { name: 'description', content: 'View and manage your profile information.' },
        { name: 'robots', content: 'noindex, nofollow' }
    ]
})
</script>