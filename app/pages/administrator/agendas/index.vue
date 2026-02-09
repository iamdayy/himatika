<script setup lang='ts'>
import { ModalsConfirmation } from "#components";
import type { DropdownMenuItem } from "@nuxt/ui";
import { format } from "date-fns";
import type { DriveStep } from "driver.js";
import { Calendar as VCalendar } from 'v-calendar';
import 'v-calendar/dist/style.css';
import type { IAgenda, ICategory } from "~~/types";
import type { IAgendaResponse, IResponse } from "~~/types/IResponse";
/**
 * Define page metadata
 */
definePageMeta({
    layout: 'dashboard',
    middleware: 'sidebase-auth'
})

/**
 * Set page title
 */
useHead({
    title: "Dashboard"
});

/**
 * Initialize composables
 */
const toast = useToast();
const overlay = useOverlay();

const ConfirmationModal = overlay.create(ModalsConfirmation);


const organizerStore = useOrganizerStore();
const { isOrganizer } = storeToRefs(organizerStore);
const { $api, $pageGuide } = useNuxtApp();
const page = ref(0);
const perPage = ref(0);
const upcomingOnly = ref(false);


const { data: agendas, refresh: refreshAgendas, pending: agendasPending } = useLazyAsyncData("agendas", () => $api<IAgendaResponse>('/api/agenda', {
    method: 'GET',
    query: {
        page: page.value,
        perPage: perPage.value,
        showMissed: !upcomingOnly.value,
    }
}), {
    transform: (data) => {
        const agendas = data.data?.agendas || [];
        const agendasCount = data.data?.length || 0;
        return {
            data: agendas,
            count: agendasCount
        };
    },
    default: () => ({
        data: [],
        count: 0
    }),
    watch: [page, perPage, upcomingOnly,]
});
/**
 * Computed property to determine if dark mode is active
 */
const isDarkMode = useDark();

/**
 * Ref to store the current event
 */
const Agenda = ref<IAgenda | null>();

/**
 * Computed property to get and set the current event
 */
const agenda = computed<IAgenda | undefined>({
    get() {
        if (Agenda.value) {
            return Agenda.value;
        }
        if (agendas.value.data) {
            const parseDate = (date: string) => new Date(date.replace(/(\d{2})\/(\d{2})\/(\d{4})/g, '$2/$1/$3'));
            const diff = (date: any, now: Date) => (parseDate(date).getTime() - now.getTime());
            const evs = agendas.value.data?.sort(({ date: date1 }, { date: date2 }) => {
                const diff1 = diff(date1.start, new Date());
                const diff2 = diff(date2.start, new Date());
                if (diff1 < 0 && diff2 >= 0) return 1;
                if (diff2 < 0 && diff1 >= 0) return -1;
                return diff1 - diff2;
            });
            return evs![0];
        }
        return undefined;
    },
    set(newVal) {
        Agenda.value = newVal
    }
})

/**
 * Function to select an event by its ID
 * @param {string} id - The ID of the event to select
 */
const pickDetail = (id: string) => {
    if (agendas.value.data) {
        const index = agendas.value.data.findIndex((agenda) => agenda._id === id);
        agenda.value = agendas.value.data[index];
    }
}

/**
 * Ref to store the picked date
 */
const pickDate = ref<Date | null>(null);

/**
 * Computed property to generate calendar attributes
 */
const attributes = computed(() => [
    ...<[]>agendas.value.data?.map(agenda => ({
        highlight: 'orange-hima',
        dates: { start: new Date(agenda.date.start), end: new Date(agenda.date.end) },
        popover: {
            label: agenda.title
        },
        order: 1
    }))
]);



const deleteModal = () => {
    ConfirmationModal.open({
        title: 'Delete Agenda',
        body: 'Are you sure you want to delete this agenda?',
        async onConfirm() {
            try {
                const response = await $api<IResponse>('/api/agenda', {
                    method: 'DELETE',
                    query: {
                        id: agenda.value?._id
                    }
                });
                ConfirmationModal.close();
                refreshAgendas();
                toast.add({
                    title: response.statusMessage,
                    description: 'Agenda has been deleted successfully',
                })
            } catch (error: any) {
                toast.add({
                    title: error.response.statusMessage,
                    description: error.response.data.message,
                })
            }
        }
    })
}

watch(agendas, () => {
    if (agendas.value.data && agendas.value.count > 0) {
        const parseDate = (date: string) => new Date(date.replace(/(\d{2})\/(\d{2})\/(\d{4})/g, '$2/$1/$3'));
        const diff = (date: any, now: Date) => (parseDate(date).getTime() - now.getTime());
        const evs = agendas.value.data?.sort(({ date: date1 }, { date: date2 }) => {
            const diff1 = diff(date1.start, new Date);
            const diff2 = diff(date2.start, new Date);
            if (diff1 < 0) return 1;
            if (diff2 < 0) return -1;
            return diff1 - diff2;
        });
        agenda.value = evs![0];
    }
})

/**
 * Detect large screen using windowSize
 */
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);

/**
 * Computed property for responsive class names
 */
const responsiveClasses = computed(() => ({
    cardHeader: isMobile.value ? 'text-2xl' : 'text-4xl',
    calendarWrapper: isMobile.value ? 'w-full' : 'w-1/3',
    eventDetailsWrapper: isMobile.value ? 'mt-4' : 'ml-4',
    eventTitle: isMobile.value ? 'text-xl' : 'text-2xl',
    listItem: isMobile.value ? 'text-sm' : 'text-base',
    icon: isMobile.value ? 'w-3 h-3' : 'w-4 h-4',
}));

/**
 * Responsive UI sizes for components
 */
const responsiveUISizes = computed<{ [key: string]: 'xs' | 'md' }>(() => ({
    button: isMobile.value ? 'xs' : 'md',
    input: isMobile.value ? 'xs' : 'md',
}));
const links = computed(() => [{
    label: 'Dasbor',
    icon: 'i-heroicons-home',
    to: '/dashboard'
},
{
    label: 'Administrator',
    icon: 'i-heroicons-shield-check',
},
{
    label: 'Agendas',
    icon: 'i-heroicons-calendar',
}]);
const dropdownOptions = computed<DropdownMenuItem[][]>(() => {
    const options: DropdownMenuItem[][] = [
        [
            {
                label: 'Buka',
                icon: 'i-heroicons-eye',
                to: `/administrator/agendas/${agenda.value?._id}`,
                target: '_blank'
            },
            {
                label: 'Copy-Link',
                icon: 'i-heroicons-clipboard',
                onSelect: () => {
                    navigator.clipboard.writeText(`${window.location.origin}/agendas/${agenda.value?._id}`);
                    toast.add({
                        title: 'Link Copied',
                        description: 'Agenda link has been copied to clipboard',
                    });
                },
            },
            {
                label: 'Bagikan',
                icon: 'i-heroicons-share',
                onSelect: () => navigator.share({
                    title: agenda.value?.title,
                    text: agenda.value?.description,
                    url: `${window.location.origin}/agendas/${agenda.value?._id}`
                })
            },
        ]]
    if (isOrganizer) {
        options[0]!.push({
            label: 'Edit',
            icon: 'i-heroicons-pencil',
            to: `/administrator/agendas/${agenda.value?._id}/edit`,
        });
        options.push([
            {
                label: 'Hapus',
                icon: 'i-heroicons-trash',
                onSelect: async () => deleteModal()
            }
        ])
    }
    return options;
});
onMounted(() => {
    const steps: DriveStep[] = [
        {
            element: '#add-agenda',
            popover: {
                title: 'Add Agenda',
                description: 'Click here to add a new agenda',
                side: 'right'
            },
        },
        {
            element: '#calendar',
            popover: {
                title: 'Agenda Calendar',
                description: 'View all your agendas in a calendar view',
                side: 'top'
            },
        },
        {
            element: '#calendar-event',
            popover: {
                title: 'Agenda Event',
                description: 'Click on an event to view more details',
                side: 'top'
            },
        },
        {
            element: '#event-details',
            popover: {
                title: 'Event Details',
                description: 'View the details of the selected event',
                side: 'left'
            },
        },
        {
            element: '#dropdown-agenda',
            popover: {
                title: 'Agenda Options',
                description: 'Edit or delete the selected agenda',
                side: 'bottom'
            },
        }
    ]
    $pageGuide('agenda', steps, {
        showProgress: true,
        showButtons: ['next', 'previous'],
    });
});
const selectDate = (date: Date) => {
    pickDate.value = date;
}
</script>
<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :items="links" />
        <UCard class="p-2 mt-2 md:p-4">
            <template #header>
                <div class="flex flex-row items-center justify-between gap-2 p-1 md:p-2">
                    <h1 class="text-lg font-semibold text-gray-600 md:text-2xl md:font-bold dark:text-gray-200">{{
                        'Agenda' }}
                    </h1>
                    <div class="min-w-24">
                        <UButton label="New" id="add-agenda" :size="responsiveUISizes.button"
                            to="/administrator/agendas/create" v-if="isOrganizer" block />
                    </div>
                </div>

            </template>
            <div class="flex flex-col w-full gap-3 md:flex-row" v-if="agendasPending">
                <USkeleton class="w-1/3" />
                <div :class="['px-4 py-4 border-gray-400 w-full space-y-2', responsiveClasses.eventDetailsWrapper]">
                    <USkeleton class="w-full h-8" />
                    <USkeleton class="w-8/12 h-24" />
                </div>
            </div>
            <div class="flex flex-col w-full gap-3 md:flex-row" v-else>
                <ClientOnly>
                    <VCalendar id="calendar" :attributes="attributes" class="max-w-full" v-if="agendas" transparent
                        @dayclick="(day: any) => selectDate(day.date)" :expanded="isMobile" :is-dark="isDarkMode"
                        borderless>
                        <template #footer>
                            <div class="px-2 pb-3" id="calendar-event">
                                <div class="mx-auto">
                                    <div class="pt-2 border-t border-gray-800 dark:border-gray-700">
                                        <div v-for="event, i in agendas.data?.filter((event: IAgenda) => {
                                            const startDate = new Date(event.date.start).setHours(0, 0, 0, 0);
                                            const endDate = new Date(event.date.end).setHours(23, 59, 59, 999);
                                            const selectedDate = new Date(pickDate!).setHours(0, 0, 0, 0);
                                            return selectedDate >= startDate && selectedDate <= endDate;
                                        })" :key="i"
                                            class="flex flex-col gap-2 px-4 py-2 cursor-pointer sm:gap-6 md:flex-row sm:items-center hover:bg-gray-200/15 rounded-3xl"
                                            @click="pickDetail(event._id as string)">
                                            <p
                                                class="text-sm font-normal text-gray-700 sm:text-right dark:text-gray-200 shrink-0">
                                                {{ format(new Date(event.date.start), 'HH:mm') }}
                                                -
                                                {{ format(new Date(event.date.end), 'HH:mm') }}
                                            </p>
                                            <h3 class="text-lg font-semibold text-gray-600 text-wrap dark:text-white">
                                                {{ event.title }}
                                            </h3>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </VCalendar>
                </ClientOnly>
                <div id="event-details"
                    :class="['px-4 py-4 border-gray-400 w-full', responsiveClasses.eventDetailsWrapper]">
                    <h5 v-if="!agenda"
                        class="my-12 mb-4 text-2xl font-semibold text-center text-yellow-300 dark:text-yellow-200">
                        {{ 'NoAgendaSelected' }}
                    </h5>
                    <div v-else>
                        <div class="flex items-center justify-between">
                            <div class="space-y-2">
                                <UBadge class="ms-2" :label="(agenda.category as ICategory).title" />
                                <p>
                                    <NuxtLink :to="`/administrator/agendas/${agenda._id}`"
                                        :class="['mb-4 font-medium text-gray-700 dark:text-gray-300 text-wrap', responsiveClasses.eventTitle]">
                                        {{ agenda?.title }}
                                    </NuxtLink>
                                </p>
                            </div>
                            <UDropdownMenu :items="dropdownOptions">
                                <UButton icon="i-ion-ellipsis-vertical" variant="link" color="neutral" />
                            </UDropdownMenu>
                        </div>
                        <ul role="list" class="my-3 space-y-3">
                            <li v-for="(item, index) in ['date', 'time', 'location', 'description']" :key="index"
                                class="flex items-center">
                                <Icon
                                    :name="['solar:calendar-outline', 'solar:clock-circle-outline', 'solar:map-point-outline', 'solar:lock-keyhole-unlocked-outline', 'solar:document-outline'][index]!"
                                    :class="['flex-shrink-0', responsiveClasses.icon]" />
                                <span
                                    :class="['font-normal leading-tight text-gray-700 dark:text-gray-200 ms-2', responsiveClasses.listItem]">
                                    <template v-if="item === 'date'">
                                        {{ format(new Date(agenda.date.start), 'dd MMMM yyyy') === format(new
                                            Date(agenda.date.end),
                                            'dd MMMM yyyy') ? format(new Date(agenda.date.start), 'dd MMMM yyyy')
                                            :
                                            `${format(new Date(agenda.date.start), 'dd MMMM yyyy')} -
                                        ${format(new Date(agenda.date.end), 'dd MMMM yyyy')}` }}
                                    </template>
                                    <template v-else-if="item === 'time'">
                                        {{ format(new Date(agenda.date.start), 'HH:mm') }} - {{ format(new
                                            Date(agenda.date.end),
                                            'HH:mm') }}
                                    </template>
                                    <template v-else-if="item === 'location'">
                                        {{ agenda.at }}
                                    </template>
                                    <template v-else-if="item === 'description'">
                                        <div class="line-clamp-3">
                                            <CoreContent :content="agenda.description" />
                                        </div>
                                    </template>
                                </span>
                            </li>
                            <li class="flex items-center justify-center">
                                <UButton color="neutral" variant="link" :size="responsiveUISizes.button"
                                    icon="i-heroicons-arrow-long-right" :to="`/administrator/agendas/${agenda._id}`"
                                    trailing>
                                    {{ 'SeeMore' }}
                                </UButton>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </UCard>
    </div>
</template>
<style scoped></style>