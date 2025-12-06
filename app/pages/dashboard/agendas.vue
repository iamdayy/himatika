<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui';
import { Calendar as VCalendar } from 'v-calendar';
import 'v-calendar/dist/style.css';
import type { IAgenda } from "~~/types";
import type { IAgendaMeResponse, IAgendaResponse } from "~~/types/IResponse";
definePageMeta({
    layout: 'dashboard',
    middleware: 'sidebase-auth'
});

const { $api, $ts } = useNuxtApp();
const router = useRouter();

// 1. Fetch Data Agenda
const { data: agendas, pending } = await useAsyncData('user-agendas-calendar',
    () => $api<IAgendaMeResponse>('/api/me/agenda', {
        method: 'GET',
        query: {
            showMissed: true
        }
    }),
    {
        transform: (res) => res.data?.agendas || { participant: [], committee: [] }
    });
const isDarkMode = useDark();


const agendaIsPast = (agenda: IAgenda) => {
    const now = new Date();
    const agendaEnd = new Date(agenda.date.end as string);
    return now > agendaEnd;
};

// 2. Fetch Agenda Terdekat (Nearest Open Agenda)
const { data: nearestAgenda, pending: pendingNearestAgenda } = await useAsyncData('nearest-open-agenda',
    () => $api<IAgendaResponse>('/api/agenda/nearest', {
        method: 'GET',
    }).then(res => res.data?.agenda || null)
);

// 3. Konfigurasi VCalendar Attributes
const calendarAttributes = computed(() => [
    ...<[]>agendas.value?.participant?.map((agenda: IAgenda) => ({
        key: agenda._id as string,
        highlight: {
            color: agendaIsPast(agenda) ? 'gray' : 'orange-hima',
            start: {
                fillMode: 'outline',
            },
            base: {
                fillMode: 'solid',
            },
            end: {
                fillMode: 'outline',
            },
        },
        dates: { start: new Date(agenda.date.start as string), end: new Date(agenda.date.end as string) },
        popover: {
            label: agenda.title,
        },
        customData: agenda // Simpan data agenda untuk handle klik
    })),
    ...<[]>agendas.value?.committee?.map((agenda: IAgenda) => ({
        key: agenda._id as string,
        highlight: {
            color: agendaIsPast(agenda) ? 'gray' : 'orange-hima',
            start: {
                fillMode: 'outline',
            },
            base: {
                fillMode: 'solid',
            },
            end: {
                fillMode: 'outline',
            },
        },
        dates: { start: new Date(agenda.date.start as string), end: new Date(agenda.date.end as string) },
        popover: {
            label: agenda.title,
        },
        customData: agenda // Simpan data agenda untuk handle klik
    })),
]);

const registeredAgendasAs = computed<TabsItem[]>(() => [
    {
        label: $ts('tabs.participant'),
        slot: 'participant',
    },
    {
        label: $ts('tabs.committee'),
        slot: 'committee',
    }
])

// 4. Handle Klik pada Tanggal di Kalender
const goToDetail = (id: string) => {
    router.push(`/agendas/${id}`);
};
const links = computed(() => [{
    label: $ts('dashboard'),
    icon: 'i-heroicons-home',
    to: '/dashboard'
},
{
    label: $ts('agendas'),
    icon: 'i-heroicons-calendar',
}]);
</script>

<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :items="links" />
        <div class="space-y-8">

            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ $ts('title') }}</h1>
                    <p class="text-gray-500 dark:text-gray-400">{{ $ts('description') }}</p>
                </div>
            </div>

            <div v-if="nearestAgenda"
                class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-900 dark:to-primary-950 shadow-xl text-white">
                <div class="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl">
                </div>
                <div
                    class="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-yellow-400 opacity-20 rounded-full blur-2xl">
                </div>

                <div class="relative p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
                    <div class="flex-shrink-0">
                        <div
                            class="w-24 h-24 md:w-32 md:h-32 bg-white/20 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center border border-white/30 text-center p-2">
                            <span class="text-4xl md:text-5xl font-bold">{{ new Date(nearestAgenda.date.start as
                                string).getDate() }}</span>
                            <span class="text-sm md:text-base uppercase tracking-wider">{{
                                new Date(nearestAgenda.date.start as string)
                                    .toLocaleDateString('id-ID',
                                        {
                                            month: 'short'
                                        }) }}</span>
                        </div>
                    </div>

                    <div class="flex-1 text-center md:text-left space-y-2">
                        <UBadge color="warning" variant="solid" size="sm" class="mb-2">{{ $ts('registrationOpen') }} 🔥
                        </UBadge>
                        <h2 class="text-2xl md:text-3xl font-bold leading-tight">{{ nearestAgenda.title }}</h2>
                        <div
                            class="flex flex-wrap items-center justify-center md:justify-start gap-4 text-primary-100 text-sm">
                            <div class="flex items-center gap-1">
                                <UIcon name="i-heroicons-clock" />
                                <span>{{
                                    new Date(nearestAgenda.date.start as string)
                                        .toLocaleTimeString([],
                                            {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                }}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <UIcon name="i-heroicons-map-pin" />
                                <span>{{ nearestAgenda.at || $ts('onlineTBA') }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="flex-shrink-0">
                        <UButton size="xl" color="primary" variant="solid" :to="`/agendas/${nearestAgenda._id}`"
                            class="text-primary-700 font-bold px-8">
                            {{ $ts('joinNow') }}
                        </UButton>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">

                <div class="lg:col-span-4 xl:col-span-3">
                    <UCard class="sticky top-4">
                        <template #header>
                            <h3 class="font-semibold text-gray-900 dark:text-white">{{ $ts('calendar') }}</h3>
                        </template>

                        <ClientOnly>
                            <VCalendar expanded transparent borderless :attributes="calendarAttributes"
                                class="dark:bg-gray-900 dark:text-gray-100" title-position="left" :is-dark="isDarkMode"
                                @dayclick="(day: any) => {
                                    console.log(day);
                                    if (day.attributes && day.attributes.length > 0) {
                                        const agenda = day.attributes[0].customData;
                                        if (agenda && agenda._id) {
                                            goToDetail(agenda._id);
                                        }
                                    }
                                }">
                                <template #day-popover="{ attributes }">
                                    <div
                                        class="text-xs text-gray-700 dark:text-gray-200 px-2 dark:bg-accent-3/35 rounded-md">
                                        <ul class="list-disc ml-3">
                                            <li v-for="{ key, customData } in attributes" :key="key">
                                                {{ customData.title }}
                                            </li>
                                        </ul>
                                    </div>
                                </template>
                            </VCalendar>
                        </ClientOnly>

                        <div class="mt-4 flex gap-4 text-xs justify-center">
                            <div class="flex items-center gap-1">
                                <span class="w-2 h-2 rounded-full bg-accent-4"></span> {{ $ts('open') }}
                            </div>
                            <div class="flex items-center gap-1">
                                <span class="w-2 h-2 rounded-full bg-gray-400"></span> {{ $ts('closed') }}
                            </div>
                        </div>
                    </UCard>
                </div>

                <div class="lg:col-span-8 xl:col-span-9 space-y-6">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-bold">{{ $ts('registeredAgendas') }}</h2>
                    </div>
                    <UTabs :items="registeredAgendasAs" class="w-full">
                        <template #participant>
                            <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <USkeleton class="h-48 w-full" v-for="i in 4" :key="i" />
                            </div>

                            <div v-else-if="agendas?.participant && agendas?.participant?.length > 0"
                                class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AgendaCard v-for="agenda in agendas?.participant || []" :key="(agenda._id as string)"
                                    :agenda="agenda" />
                            </div>

                            <div v-else
                                class="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                <UIcon name="i-heroicons-calendar" class="text-4xl text-gray-400 mb-2" />
                                <p class="text-gray-500">{{ $ts('noAgendas.title') }}</p>
                            </div>
                        </template>
                        <template #committee>
                            <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <USkeleton class="h-48 w-full" v-for="i in 4" :key="i" />
                            </div>

                            <div v-else-if="agendas?.committee && agendas?.committee.length > 0"
                                class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AgendaCard v-for="agenda in agendas?.committee || []" :key="(agenda._id as string)"
                                    :agenda="agenda" />
                            </div>

                            <div v-else
                                class="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                <UIcon name="i-heroicons-calendar" class="text-4xl text-gray-400 mb-2" />
                                <p class="text-gray-500">{{ $ts('noAgendas.title') }}</p>
                            </div>
                        </template>
                    </UTabs>

                </div>

            </div>
        </div>
    </div>
</template>

<style scoped>
/* Custom Style untuk VCalendar agar match dengan Dark Mode Nuxt UI */
:deep(.vc-container) {
    --vc-bg: transparent;
    --vc-border: transparent;
    font-family: inherit;
}

:deep(.vc-day-content:hover) {
    background-color: rgba(var(--color-primary-500), 0.1);
}
</style>