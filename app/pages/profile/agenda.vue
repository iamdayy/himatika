<!-- TODO: UPDATE TO MORE PERFECT -->
<template>
    <div class="flex flex-wrap gap-6">
        <!-- Main content -->
        <div class="flex-1">
            <div class="flex flex-wrap items-center justify-between gap-2 px-2 py-4">
                <UBreadcrumb :items="breadcumbs" class="ms-4" />
            </div>
            <UCard v-if="viewMode === 'calendar'">
                <template #header>
                    <!-- Header -->
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <h1 class="text-2xl font-semibold">Calendar</h1>
                        <UButton variant="outline" :size="responsiveUISizes.button" @click="viewMode = 'list'">
                            <template #leading>
                                <UIcon name="heroicons-calendar" class="w-4 h-4" />
                            </template>
                            <span v-if="!isMobile">
                                Calendar View
                            </span>
                        </UButton>
                    </div>
                    <div class="flex items-center w-full py-2 md:justify-end gap-x-2 md:py-4">
                        <USelect v-model="status" :items="['members', 'committees']" />
                        <div class="flex flex-col items-center gap-2">
                            <label class="text-xs font-light text-gray-600 dark:text-gray-200" for="published">show
                                missed</label>
                            <USwitch v-model="showMissed" id="published" size="xs" />
                        </div>
                    </div>
                </template>

                <!-- Calendar navigation -->
                <div class="flex items-center justify-center mb-4">
                    <div class="flex items-center space-x-2">
                        <UButton icon="i-heroicons-chevron-left" variant="outline" @click="prevMonth" />
                        <span class="text-lg font-medium">{{ currentMonth }} {{ currentYear }}</span>
                        <UButton icon="i-heroicons-chevron-right" variant="outline" @click="nextMonth" />
                    </div>
                </div>

                <!-- Calendar grid -->
                <div>
                    <!-- Month view content -->
                    <div class="grid grid-cols-7 gap-2">
                        <div v-for="day in ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']" :key="day"
                            class="py-2 font-medium text-center text-gray-500 dark:text-gray-300">
                            {{ day }}
                        </div>
                        <div v-for="day in monthDays" :key="day.date"
                            class="p-2 overflow-y-auto border rounded-lg md:h-32">
                            <span class="text-sm">{{ day.date }}</span>
                            <div v-if="!isMobile" v-for="(event, index) in eventsForDay(day.date).slice(0, 3)"
                                :key="index" class="p-1 text-xs rounded">
                                <div class="flex items-center gap-1 p-1 rounded cursor-pointer hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-800"
                                    @click="selectEvent(event.date.start as Date)">
                                    <span class="text-xs md:text-sm">{{ new Date(event.date.start as
                                        string).toLocaleTimeString('id-ID',
                                            {
                                                hour:
                                                    '2-digit', minute: '2-digit'
                                            }) }}</span>
                                    <span class="text-xs text-gray-600 dark:text-gray-200 md:text-sm">{{ event.title
                                        }}</span>
                                </div>
                            </div>
                            <div v-else class="flex flex-wrap gap-px">
                                <div v-for="(event, index) in eventsForDay(day.date)" :key="index">
                                    <UTooltip :text="event.title" :popper="{ strategy: 'absolute' }">
                                        <div class="w-2 h-2 bg-gray-400 rounded-full cursor-pointer dark:text-gray-300 dark:bg-ray-600"
                                            @click="selectEvent(event.date.start as Date)"></div>
                                    </UTooltip>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </UCard>
            <UCard v-if="viewMode === 'list'">
                <template #header>
                    <!-- Header -->
                    <div class="flex flex-wrap items-center justify-between">
                        <h1 class="text-2xl font-semibold">Agenda</h1>
                        <UButton variant="outline" size="sm" @click="viewMode = 'calendar'">
                            <template #leading>
                                <UIcon name="heroicons-queue-list" class="w-4 h-4" />
                            </template>
                            <span v-if="!isMobile">
                                List View
                            </span>
                        </UButton>
                    </div>
                    <div class="flex flex-wrap items-center justify-between py-2">
                        <UInput v-model="search" :size="responsiveUISizes.input" icon="i-heroicons-magnifying-glass"
                            placeholder="Search agendas..." class="mt-2 mb-4 mb:mt-4 sm:mb-0 sm:w-64" />
                        <div class="flex flex-row gap-2 mt-4 mb-8 md:items-center md:justify-between">
                            <USelect v-model="status" :items="['members', 'committees']" />
                            <div class="flex items-center gap-2">
                                <USelect v-model="sort" :items="sortOptions" placeholder="Sort by" />
                                <UButton :size="responsiveUISizes.button" variant="ghost"
                                    :icon="order == 'asc' ? 'i-heroicons-arrow-up' : order == 'desc' ? 'i-heroicons-arrow-down' : 'i-heroicons-arrows-up-down'"
                                    @click="order = order == '' ? 'asc' : order == 'asc' ? 'desc' : ''" />
                            </div>
                            <div class="flex flex-row items-center gap-2">
                                <div class="flex flex-col items-center gap-2">
                                    <label class="text-xs font-light text-gray-600 dark:text-gray-400"
                                        for="published">show
                                        missed</label>
                                    <USwitch v-model="showMissed" id="published" size="xs" />
                                </div>
                                <UButton :size="responsiveUISizes.button" color="primary" variant="ghost"
                                    icon="i-heroicons-arrow-path" @click="refresh()">
                                </UButton>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- List view content -->
                <div class="mt-4 space-y-2">
                    <div v-for="(year, yearIndex) in Object.keys(groupedAgendas)" :key="yearIndex" class="mb-4">
                        <h3 class="text-lg font-bold md:text-xl dark:text-gray-200">{{ year }}</h3>
                        <div v-for="(month, monthIndex) in Object.keys(groupedAgendas[year]!)" :key="monthIndex"
                            class="my-2">
                            <h3 class="font-semibold md:text-lg dark:text-gray-200 ms-3">{{ month }}</h3>
                            <div v-for="(agenda, index) in groupedAgendas[year]![month]!" :key="index" class="my-2">
                                <div
                                    class="pb-2 dark:border-gray-700/25 hover:bg-gray-400/25 dark:hover:bg-gray-200/25 rounded-xl">
                                    <NuxtLink :to="`/agendas/${agenda._id}`">
                                        <div class="flex items-center">
                                            <div class="w-16 text-center">
                                                <div class="text-sm text-gray-500">{{ new
                                                    Date(agenda.date.start as string).toLocaleDateString('id-ID',
                                                        {
                                                            weekday:
                                                                'long'
                                                        }) }}</div>
                                                <div class="text-2xl font-bold text-orange-500">{{ new
                                                    Date(agenda.date.start as string).getDate()
                                                }}
                                                </div>
                                            </div>
                                            <div class="flex-grow ml-4">
                                                <div class="flex items-center justify-between">
                                                    <div class="flex items-center">
                                                        <UIcon name="i-heroicons-clock" class="mr-1 " />
                                                        <span class="text-sm text-gray-500">{{ new
                                                            Date(agenda.date.start as
                                                                string).toLocaleTimeString('id-ID', {
                                                                    hour:
                                                                        '2-digit', minute: '2-digit'
                                                                }) }}</span>
                                                    </div>
                                                </div>
                                                <div class="text-lg font-medium md:text-xl">{{ agenda.title }}</div>
                                                <div class="flex items-center mt-1">
                                                    <UIcon name="i-heroicons-map-pin" class="mr-1" />
                                                    <span class="text-sm text-gray-500">{{ agenda.at }}</span>
                                                </div>
                                                <div class="flex mt-2">
                                                    <NuxtImg provider="localProvider"
                                                        v-for="(committee, pIndex) in agenda.committees" :key="pIndex"
                                                        :src="(committee.member as IMember).avatar || '/img/profile-blank.png'"
                                                        class="w-8 max-w-sm -ml-2 border-2 border-white rounded-full first:ml-0" />
                                                </div>
                                            </div>
                                        </div>
                                    </NuxtLink>
                                </div>
                                <hr class="h-px mt-4 bg-gray-200 border-0 dark:bg-gray-700">
                            </div>
                        </div>
                    </div>
                </div>
                <template #footer>
                    <div class="flex flex-col items-center justify-between gap-2 md:flex-row">
                        <div class="flex items-center gap-1.5 mb-2 sm:mb-0">
                            <span class="text-xs leading-none md:text-sm md:leading-5">{{ $ts('rows_per_page') }}</span>
                            <USelect v-model="page" :items="perPageOptions" class="w-20 me-2" size="xs" />
                        </div>
                        <div class="mb-2 sm:mb-0">
                            <span class="text-xs leading-none md:text-sm md:leading-5">
                                {{ $ts('showing_results', { start: pageFrom, end: pageTo, total: pageTotal }) }}
                            </span>
                        </div>
                        <UPagination v-model:page="page" :items-per-page="perPage" :total="pageTotal"
                            :sibling-count="isMobile ? 2 : 6" />
                    </div>
                </template>
            </UCard>

        </div>

        <!-- Event details sidebar -->
        <div class="w-full md:w-64">
            <UCard>
                <div class="space-y-6 ">
                    <div>
                        <h3 class="mb-2 font-semibold">Agenda Name</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-300">
                            {{ selectedEvent ? selectedEvent.title : 'No Even Selected' }}
                        </p>
                    </div>
                    <div>
                        <h3 class="mb-2 font-semibold">Agenda Place</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-300">
                            {{ selectedEvent ? selectedEvent.at : 'No Event Selected' }}
                        </p>
                    </div>
                    <div>
                        <h3 class="mb-2 font-semibold">Agenda Description</h3>
                        <div class="line-clamp-3" v-if="selectedEvent">
                            <CoreContent :content="selectedEvent.description" />
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-300" v-else>No Event Selected</p>
                    </div>
                    <div class="flex justify-end w-full">
                        <UButton to="/" variant="outline" color="neutral">See more...</UButton>
                    </div>
                </div>
            </UCard>

        </div>
    </div>
</template>

<script setup lang="ts">
import type { IAgenda, IMember } from '~~/types';
import type { IAgendaMeResponse } from '~~/types/IResponse';

definePageMeta({
    layout: 'dashboard'
});

type groupedAgendas = {
    [key: string]: {
        [key: string]: IAgenda[]
    }
}

// Use window size to determine if the device is mobile
const windowSize = useWindowSize();
const { $api } = useNuxtApp();
const { $ts } = useI18n();
const isMobile = computed(() => windowSize.width.value < 640);
const currentDate = ref(new Date());
const viewMode = ref<'calendar' | 'list'>('calendar');


const status = ref<'members' | 'committees'>('members');
const search = ref('');
const showMissed = ref(false);

// Pagination
const page = ref<number>(1);
const perPage = ref<number>(5);
const sort = ref('date');
const order = ref<'asc' | 'desc' | ''>('');

// Assume agendasMe is provided and structured properly
const { data, refresh } = useLazyAsyncData(() => $api<IAgendaMeResponse>('/api/me/agenda', {
    query: {
        status: status.value,
        page: viewMode.value === 'list' ? page.value : 0,
        perPage: viewMode.value === 'list' ? perPage.value : 0,
        sort: sort.value,
        order: order.value,
        search: search.value,
        showMissed: showMissed.value
    }
}), {
    watch: [status, page, perPage, sort, order, search, showMissed]
});
const agendasCount = computed(() => data.value?.data?.length);
const perPageOptions = computed(() => {
    const baseOptions = [5, 10, 20, 50, 100];
    const filteredOptions = baseOptions.filter((option) => option <= pageTotal.value);

    if (isMobile.value && filteredOptions.length > 3) {
        return filteredOptions.slice(0, 3);
    }

    return filteredOptions;
});
const pageTotal = computed(() => agendasCount.value || 0) // This value should be dynamic coming from the API
const pageFrom = computed(() => (page.value! - 1) * perPage.value! + 1)
const pageTo = computed(() => Math.min(page.value! * perPage.value!, pageTotal.value || 0))

const sortOptions = ['date', 'title'];
const agendas = computed<IAgenda[] | undefined>(() => data.value?.data?.agendas);
// Categorized Agendas
const categorizedAgendas = computed(() => {
    const acc: { [key: string]: { [key: string]: IAgenda[] } } = {};

    agendas.value?.forEach((current) => {
        // Parse the date string into a Date object
        const date = { start: new Date(current.date.start as string), end: new Date(current.date.end as string) }; // Assuming current.date is a valid date string

        const year = date.start.getFullYear();
        const month = date.start.toLocaleString('default', { month: 'long' });

        if (!acc[year]) {
            acc[year] = {};
        }

        if (!acc[year][month]) {
            acc[year][month] = [];
        }

        acc[year][month].push({ ...current, date }); // Store the Date object instead of the string
    });

    return acc;
});

// Flatten categorizedAgendas into events array
const events = computed(() => {
    const flatEvents: IAgenda[] = [];
    for (const year in categorizedAgendas.value) {
        for (const month in categorizedAgendas.value[year]) {
            flatEvents.push(...categorizedAgendas.value[year][month]!);
        }
    }
    return flatEvents;
});
watch(viewMode, () => {
    if (viewMode.value === 'list') {
        page.value = 1;
        perPage.value = 5;
    } else {
        page.value = 0;
        perPage.value = 0;
    }
});
// Computed properties for month and year
const currentMonth = computed(() => currentDate.value.toLocaleString('default', { month: 'long' }));
const currentYear = computed(() => currentDate.value.getFullYear());

// Calculate the number of days in the current month
const daysInMonth = computed(() => new Date(currentYear.value, currentDate.value.getMonth() + 1, 0).getDate());

const groupedAgendas = computed<groupedAgendas>(() => {
    const grouped: groupedAgendas = {};

    agendas.value?.forEach((agenda) => {
        const month = new Date(agenda.date.start as string).toLocaleString('default', { month: 'long' });
        const year = new Date(agenda.date.start as string).toLocaleString('default', { year: 'numeric' });
        if (!grouped[year]) {
            grouped[year] = {};
        }
        if (!grouped[year][month]) {
            grouped[year][month] = [];
        }
        grouped[year][month].push(agenda);
    });

    return grouped;
});
// Generate an array of days for the current month
const monthDays = computed(() => {
    const days = [];
    for (let i = 1; i <= daysInMonth.value; i++) {
        days.push({ date: i });
    }
    return days;
});
// Function to navigate to the previous month
function prevMonth() {
    currentDate.value.setMonth(currentDate.value.getMonth() - 1);
    currentDate.value = new Date(currentDate.value); // Update the currentDate ref
}

// Function to navigate to the next month
function nextMonth() {
    currentDate.value.setMonth(currentDate.value.getMonth() + 1);
    currentDate.value = new Date(currentDate.value); // Update the currentDate ref
}

// Function to get events for a specific day
function eventsForDay(date: number) {
    return events.value.filter((event) => {
        const eventDate = new Date(event.date.start as string); // Convert event.date back to Date object
        return eventDate.getDate() === date && eventDate.getMonth() === currentDate.value.getMonth() && eventDate.getFullYear() === currentDate.value.getFullYear();
    });
}

const selectEvent = (date: Date) => {
    selectedEvent.value = eventsForDay(date.getDate()).find((event) => {
        const eventDate = new Date(event.date.start as string);
        return eventDate.getTime() === date.getTime();
    });

}

const responsiveUISizes = computed<{ [key: string]: 'xs' | 'sm' }>(() => ({
    input: isMobile.value ? 'xs' : 'sm',
    button: isMobile.value ? 'xs' : 'sm',
    select: isMobile.value ? 'xs' : 'sm',
    toggle: isMobile.value ? 'xs' : 'sm',
}));

// Selected event
const selectedEvent = ref<IAgenda | undefined>(undefined);
const breadcumbs = [{ label: $ts('profile'), icon: 'i-heroicons-user', to: '/profile' }, { label: $ts('agenda'), icon: 'i-heroicons-calendar' }]
</script>